import React, { useState, useEffect } from 'react';
import { Trip, Quote } from '../types';
import { Modal, Button, Input, Badge, Card } from './CommonUI';
import { parseWhatsAppQuotes, ParsedQuoteBlock } from '../lib/whatsapp/parseWhatsAppQuotes';
import { supabaseDataProvider } from '../lib/supabaseDataProvider';

interface WhatsAppQuoteImportModalProps {
  trip: Trip;
  onClose: () => void;
  onImported: () => void;
}

const WhatsAppQuoteImportModal: React.FC<WhatsAppQuoteImportModalProps> = ({ trip, onClose, onImported }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [rawText, setRawText] = useState('');
  const [parsedQuotes, setParsedQuotes] = useState<ParsedQuoteBlock[]>([]);
  const [selectedQuotes, setSelectedQuotes] = useState<Set<string>>(new Set());
  const [vendorProfiles, setVendorProfiles] = useState<any[]>([]);
  const [matchedVendor, setMatchedVendor] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadVendorProfiles();
  }, []);

  const loadVendorProfiles = async () => {
    try {
      const profiles = await supabaseDataProvider.getVendorProfiles();
      setVendorProfiles(profiles);
    } catch (error) {
      console.error('Erro ao carregar perfis:', error);
    }
  };

  const handleParse = () => {
    if (!rawText.trim()) return;

    const parsed = parseWhatsAppQuotes(rawText, {
      myNames: ['Você', 'Eu'],
      myPhones: []
    });

    setParsedQuotes(parsed);
    setSelectedQuotes(new Set(parsed.map(q => q.id)));

    // Tentar encontrar fornecedor pelo número
    if (parsed.length > 0) {
      const phone = parsed[0].vendorPhone.replace(/\D/g, '');
      const matched = vendorProfiles.find(v => 
        v.whatsapp_numbers?.some((n: string) => n.replace(/\D/g, '') === phone)
      );
      setMatchedVendor(matched);
    }

    setStep(2);
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const quotesToImport = parsedQuotes.filter(q => selectedQuotes.has(q.id));
      
      for (const quote of quotesToImport) {
        const quoteData: Partial<Quote> = {
          ...quote.suggestedQuote,
          tripId: trip.id,
          segmentId: trip.segments[0]?.id || 'seg-all',
          participantIds: ['ALL'],
          vendor_profile_id: matchedVendor?.id,
          source_type: matchedVendor ? undefined : 'texto',
          source_value: matchedVendor ? undefined : quote.rawText
        };

        await supabaseDataProvider.saveQuote(quoteData as Quote);
      }

      onImported();
      onClose();
    } catch (error) {
      console.error('Erro ao importar:', error);
      alert('Erro ao importar orçamentos. Tente novamente.');
    } finally {
      setImporting(false);
    }
  };

  const toggleQuote = (id: string) => {
    const newSet = new Set(selectedQuotes);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedQuotes(newSet);
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'alta': return 'green';
      case 'média': return 'yellow';
      case 'baixa': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="xl">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            📱 Importar Orçamentos do WhatsApp
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Cole a conversa do WhatsApp e o sistema detectará automaticamente os orçamentos
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-400' : 'text-gray-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${step >= 1 ? 'bg-indigo-600 border-indigo-400' : 'bg-gray-900 border-gray-700'}`}>
              1
            </div>
            <span className="text-xs font-bold uppercase">Colar Texto</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-800"></div>
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-400' : 'text-gray-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${step >= 2 ? 'bg-indigo-600 border-indigo-400' : 'bg-gray-900 border-gray-700'}`}>
              2
            </div>
            <span className="text-xs font-bold uppercase">Revisar</span>
          </div>
        </div>

        {/* Step 1: Paste Text */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">
                Cole o texto da conversa do WhatsApp
              </label>
              <textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder="[09:11, 21/01/2026] +1 (407) 936-4569: TOYOTA SIENNA OR SIMILAR...&#10;a vista com desconto R$6.876,00&#10;Cartão de crédito R$7.190,00..."
                rows={12}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors font-mono text-sm resize-none"
              />
              <p className="text-xs text-gray-600 mt-2">
                💡 Dica: Copie toda a conversa incluindo as mensagens do fornecedor
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                variant="primary" 
                onClick={handleParse}
                disabled={!rawText.trim()}
              >
                Analisar Mensagens →
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Review Quotes */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Vendor Match */}
            {matchedVendor && (
              <Card className="!bg-emerald-600/10 !border-emerald-600/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                    ✓
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-400">Fornecedor Reconhecido</p>
                    <p className="text-xs text-gray-400">{matchedVendor.name}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Parsed Quotes */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-gray-400">
                  {parsedQuotes.length} orçamento(s) detectado(s)
                </p>
                <Button 
                  variant="ghost" 
                  className="text-xs"
                  onClick={() => {
                    if (selectedQuotes.size === parsedQuotes.length) {
                      setSelectedQuotes(new Set());
                    } else {
                      setSelectedQuotes(new Set(parsedQuotes.map(q => q.id)));
                    }
                  }}
                >
                  {selectedQuotes.size === parsedQuotes.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </Button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {parsedQuotes.map(quote => (
                  <Card 
                    key={quote.id}
                    className={`!p-4 cursor-pointer transition-all ${
                      selectedQuotes.has(quote.id) 
                        ? '!border-indigo-500 !bg-indigo-500/10' 
                        : '!border-gray-800 hover:!border-gray-700'
                    }`}
                    onClick={() => toggleQuote(quote.id)}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedQuotes.has(quote.id)}
                        onChange={() => toggleQuote(quote.id)}
                        className="mt-1 w-5 h-5 accent-indigo-500"
                        onClick={e => e.stopPropagation()}
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-white text-sm leading-tight">{quote.title}</h4>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <Badge color="indigo" className="text-[9px]">{quote.category}</Badge>
                              <Badge color={getConfidenceColor(quote.confidence)} className="text-[9px]">
                                {quote.confidence}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black text-white">
                              R$ {quote.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            {quote.installments > 1 && (
                              <p className="text-xs text-gray-500">
                                {quote.installments}x de R$ {quote.installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Payment Options */}
                        {(quote.cashPrice || quote.creditPrice) && (
                          <div className="flex flex-wrap gap-2 text-xs">
                            {quote.cashPrice && (
                              <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded">
                                💰 À vista: R$ {quote.cashPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                            {quote.creditPrice && (
                              <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded">
                                💳 Cartão: R$ {quote.creditPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                            {quote.cashDiscount && quote.cashDiscount > 0 && (
                              <span className="px-2 py-1 bg-amber-600/20 text-amber-400 rounded">
                                🎁 Economia: R$ {quote.cashDiscount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Missing Fields Warning */}
                        {quote.missingFields.length > 0 && (
                          <p className="text-xs text-amber-500">
                            ⚠️ Faltando: {quote.missingFields.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between gap-3 pt-4 border-t border-gray-800">
              <Button variant="ghost" onClick={() => setStep(1)}>
                ← Voltar
              </Button>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={onClose}>
                  Cancelar
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleImport}
                  disabled={selectedQuotes.size === 0 || importing}
                >
                  {importing ? 'Importando...' : `Importar ${selectedQuotes.size} Orçamento(s)`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default WhatsAppQuoteImportModal;
