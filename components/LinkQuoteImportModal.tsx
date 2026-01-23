import React, { useState } from 'react';
import { Trip, Quote, Currency, QuoteStatus, PaymentMethod } from '../types';
import { Modal, Button, Input, Badge, Card } from './CommonUI';
import { supabaseDataProvider } from '../lib/supabaseDataProvider';

interface LinkQuoteImportModalProps {
  trip: Trip;
  onClose: () => void;
  onImported: () => void;
}

interface LinkPreview {
  url: string;
  title: string;
  description: string;
  image?: string;
  price?: number;
  currency?: string;
  category?: string;
  provider?: string;
  confidence: 'alta' | 'média' | 'baixa';
}

const LinkQuoteImportModal: React.FC<LinkQuoteImportModalProps> = ({ trip, onClose, onImported }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [importing, setImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: trip.categories[0] || 'Diversos',
    price: 0,
    currency: 'BRL' as Currency,
    notes: ''
  });

  // Detectar categoria e fornecedor pelo domínio
  const analyzeUrl = (url: string): Partial<LinkPreview> => {
    const domain = new URL(url).hostname.toLowerCase();
    
    let category = 'Diversos';
    let provider = '';
    
    // Hospedagem
    if (domain.includes('booking.com')) {
      category = 'Hospedagem';
      provider = 'Booking.com';
    } else if (domain.includes('airbnb')) {
      category = 'Hospedagem';
      provider = 'Airbnb';
    } else if (domain.includes('hotels.com')) {
      category = 'Hospedagem';
      provider = 'Hotels.com';
    } else if (domain.includes('expedia')) {
      category = 'Hospedagem';
      provider = 'Expedia';
    }
    // Voos
    else if (domain.includes('decolar') || domain.includes('despegar')) {
      category = 'Voo';
      provider = 'Decolar';
    } else if (domain.includes('maxmilhas')) {
      category = 'Voo';
      provider = 'MaxMilhas';
    } else if (domain.includes('skyscanner')) {
      category = 'Voo';
      provider = 'Skyscanner';
    } else if (domain.includes('kayak')) {
      category = 'Voo';
      provider = 'Kayak';
    }
    // Aluguel de Carro
    else if (domain.includes('rentcars')) {
      category = 'Aluguel de Carro';
      provider = 'RentCars';
    } else if (domain.includes('rentalcars')) {
      category = 'Aluguel de Carro';
      provider = 'RentalCars';
    } else if (domain.includes('localiza')) {
      category = 'Aluguel de Carro';
      provider = 'Localiza';
    }
    // Ingressos
    else if (domain.includes('getyourguide')) {
      category = 'Ingressos/Atrações';
      provider = 'GetYourGuide';
    } else if (domain.includes('viator')) {
      category = 'Ingressos/Atrações';
      provider = 'Viator';
    } else if (domain.includes('ticketmaster')) {
      category = 'Ingressos/Atrações';
      provider = 'Ticketmaster';
    }
    
    return { category, provider };
  };

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    
    setLoading(true);
    try {
      // Validar URL
      const urlObj = new URL(url);
      
      // Análise básica pelo domínio
      const analysis = analyzeUrl(url);
      
      // Criar preview básico
      const basicPreview: LinkPreview = {
        url,
        title: `Orçamento de ${analysis.provider || urlObj.hostname}`,
        description: `Link importado de ${urlObj.hostname}`,
        category: analysis.category || 'Diversos',
        provider: analysis.provider || urlObj.hostname,
        confidence: analysis.provider ? 'alta' : 'média'
      };
      
      setPreview(basicPreview);
      setFormData({
        title: basicPreview.title,
        category: basicPreview.category || trip.categories[0],
        price: 0,
        currency: 'BRL',
        notes: `Link: ${url}`
      });
      
      setStep(2);
    } catch (error) {
      setErrorMessage('URL inválida. Por favor, cole um link válido.');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!formData.price || formData.price <= 0) {
      setErrorMessage('Por favor, informe o valor do orçamento.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    setImporting(true);
    try {
      const quoteData: Partial<Quote> = {
        tripId: trip.id,
        title: formData.title,
        category: formData.category,
        currency: formData.currency,
        totalAmount: formData.price,
        exchangeRate: formData.currency === 'BRL' ? 1 : 5.2,
        amountBrl: formData.currency === 'BRL' ? formData.price : formData.price * 5.2,
        linkUrl: url,
        source_type: 'link',
        source_value: url,
        provider: preview?.provider,
        status: QuoteStatus.ANALYSIS,
        validUntil: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        segmentId: trip.segments[0]?.id || null, // Usar primeiro segmento real ou null
        participantIds: ['ALL'],
        notesInternal: formData.notes,
        paymentTerms: {
          methods: [PaymentMethod.CREDIT_CARD],
          installments: 1,
          installmentValue: formData.currency === 'BRL' ? formData.price : formData.price * 5.2
        }
      };

      await supabaseDataProvider.saveQuote(quoteData as Quote);
      onImported();
      onClose();
    } catch (error) {
      console.error('Erro ao importar:', error);
      setErrorMessage('Erro ao importar orçamento. Tente novamente.');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setImporting(false);
    }
  };

  const getProviderIcon = (provider?: string) => {
    if (!provider) return '🔗';
    const p = provider.toLowerCase();
    if (p.includes('booking')) return '🏨';
    if (p.includes('airbnb')) return '🏠';
    if (p.includes('decolar') || p.includes('voo')) return '✈️';
    if (p.includes('car') || p.includes('localiza')) return '🚗';
    if (p.includes('guide') || p.includes('viator')) return '🎫';
    return '🔗';
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="lg">
      <div className="p-6 space-y-6">
        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-600/20 border border-red-600/30 text-red-400 px-4 py-3 rounded-xl text-sm animate-in fade-in duration-300">
            ⚠️ {errorMessage}
          </div>
        )}
        
        {/* Header */}
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            🔗 Importar de Site/Link
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Cole o link do Booking, Airbnb, Decolar ou qualquer site de viagem
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-400' : 'text-gray-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${step >= 1 ? 'bg-indigo-600 border-indigo-400' : 'bg-gray-900 border-gray-700'}`}>
              1
            </div>
            <span className="text-xs font-bold uppercase">Colar Link</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-800"></div>
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-400' : 'text-gray-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${step >= 2 ? 'bg-indigo-600 border-indigo-400' : 'bg-gray-900 border-gray-700'}`}>
              2
            </div>
            <span className="text-xs font-bold uppercase">Completar Dados</span>
          </div>
        </div>

        {/* Step 1: Paste URL */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">
                Cole o link do site
              </label>
              <Input
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://www.booking.com/hotel/..."
                onKeyDown={e => {
                  if (e.key === 'Enter' && url.trim()) {
                    handleAnalyze();
                  }
                }}
              />
              <p className="text-xs text-gray-600 mt-2">
                💡 Suportado: Booking, Airbnb, Decolar, Hotels.com, RentCars, GetYourGuide, Viator e mais
              </p>
            </div>

            {/* Exemplos */}
            <Card className="!bg-gray-900/40 !border-gray-800">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Exemplos:</p>
              <div className="space-y-1 text-xs text-gray-600">
                <p>🏨 Booking: https://www.booking.com/hotel/...</p>
                <p>🏠 Airbnb: https://www.airbnb.com/rooms/...</p>
                <p>✈️ Decolar: https://www.decolar.com/...</p>
                <p>🚗 RentCars: https://www.rentcars.com/...</p>
              </div>
            </Card>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                variant="primary" 
                onClick={handleAnalyze}
                disabled={!url.trim() || loading}
              >
                {loading ? 'Analisando...' : 'Analisar Link →'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Complete Data */}
        {step === 2 && preview && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Preview Card */}
            <Card className="!bg-indigo-600/10 !border-indigo-600/30">
              <div className="flex items-start gap-3">
                <div className="text-3xl">{getProviderIcon(preview.provider)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-white">{preview.provider}</p>
                    <Badge color={preview.confidence === 'alta' ? 'green' : 'yellow'} className="text-[9px]">
                      {preview.confidence}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">{preview.description}</p>
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 inline-block"
                  >
                    Abrir link original →
                  </a>
                </div>
              </div>
            </Card>

            {/* Form */}
            <div className="space-y-4">
              <Input
                label="Título do Orçamento *"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="Ex: Hotel Hilton Orlando - 5 noites"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  as="select"
                  label="Categoria *"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  {trip.categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Input>

                <Input
                  as="select"
                  label="Moeda *"
                  value={formData.currency}
                  onChange={e => setFormData({...formData, currency: e.target.value as Currency})}
                >
                  <option value="BRL">BRL (Real)</option>
                  <option value="USD">USD (Dólar)</option>
                </Input>
              </div>

              <Input
                label="Valor Total *"
                type="number"
                step="0.01"
                value={formData.price || ''}
                onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
              />

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  placeholder="Adicione observações sobre este orçamento..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
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
                  disabled={!formData.title.trim() || !formData.price || importing}
                >
                  {importing ? 'Importando...' : 'Importar Orçamento'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default LinkQuoteImportModal;
