# Instruções Precisas para Refatorar TravelerWizard

## Mudanças Necessárias no components/TravelerWizard.tsx

### 1. IMPORTS (linhas 1-7)
```typescript
// TROCAR:
import { dataProvider } from '../lib/dataProvider';

// POR:
import { supabaseDataProvider } from '../lib/supabaseDataProvider';
```

### 2. PROPS INTERFACE (linhas ~50-55)
```typescript
// TROCAR:
interface TravelerWizardProps {
  trip: Trip;
  initialData?: Partial<Traveler>;
  onSave: (traveler: Traveler) => void;
  onCancel: () => void;
}

// POR:
interface TravelerWizardProps {
  tripId?: string;
  trip?: Trip;
  existingProfileId?: string;
  onDone?: (profileId: string) => void;
  onCancel: () => void;
}
```

### 3. COMPONENT SIGNATURE (linha ~57)
```typescript
// TROCAR:
const TravelerWizard: React.FC<TravelerWizardProps> = ({ trip, initialData, onSave, onCancel }) => {

// POR:
const TravelerWizard: React.FC<TravelerWizardProps> = ({ tripId, trip, existingProfileId, onDone, onCancel }) => {
```

### 4. STATE VARIABLES (linhas ~58-80)
```typescript
// ADICIONAR após os states existentes:
const [profileId, setProfileId] = useState<string | undefined>(existingProfileId);
const [tripTravelerId, setTripTravelerId] = useState<string | undefined>();

// SEPARAR formData em dois:
// 1) profileData (dados globais):
const [profileData, setProfileData] = useState<any>({
  fullName: '',
  nickname: '',
  phone: '',
  email: '',
  birthDate: '',
  canDrive: false,
  tags: [],
  notes: ''
});

// 2) tripData (dados específicos da viagem):
const [tripData, setTripData] = useState<any>({
  type: TravelerType.ADULT,
  coupleId: trip?.couples[0]?.id || '',
  goesToSegments: trip?.segments.filter(s => /^[0-9a-f]{8}/.test(s.id)).map(s => s.id) || [],
  isPayer: true,
  countInSplit: true
});
```

### 5. useEffect PARA CARREGAR PERFIL (linhas ~82-100)
```typescript
// TROCAR o useEffect que carrega documentos:
useEffect(() => {
  const loadDocuments = async () => {
    if (initialData?.id) {
      const docs = await dataProvider.getTravelerDocuments(initialData.id);
      setDocuments(docs);
    }
  };
  loadDocuments();
}, [initialData?.id]);

// POR:
useEffect(() => {
  const loadProfile = async () => {
    if (existingProfileId) {
      setLoadingDocs(true);
      try {
        const profile = await supabaseDataProvider.getTravelerProfileById(existingProfileId);
        if (profile) {
          setProfileData({
            fullName: profile.full_name || '',
            nickname: profile.nickname || '',
            phone: profile.phone || '',
            email: profile.email || '',
            birthDate: profile.birth_date || '',
            canDrive: profile.can_drive || false,
            tags: profile.tags || [],
            notes: profile.notes || ''
          });
          
          const docs = await supabaseDataProvider.getTravelerProfileDocuments(existingProfileId);
          setDocuments(docs);
          
          if (tripId) {
            const tripTravelers = await supabaseDataProvider.getTripTravelers(tripId);
            const link = tripTravelers.find((tt: any) => tt.traveler_profile_id === existingProfileId);
            if (link) {
              setTripTravelerId(link.id);
              setTripData({
                type: link.type,
                coupleId: link.couple_id,
                goesToSegments: link.goes_to_segments,
                isPayer: link.is_payer,
                countInSplit: link.count_in_split
              });
            }
          }
        }
      } finally {
        setLoadingDocs(false);
      }
    }
  };
  loadProfile();
}, [existingProfileId, tripId]);
```

### 6. handleNext FUNCTION (linhas ~110-112)
```typescript
// TROCAR:
const handleNext = () => setStep(s => Math.min(s + 1, 3));

// POR:
const handleNext = async () => {
  // Step 1 -> Step 2: Salvar perfil global
  if (step === 1) {
    try {
      const saved = await supabaseDataProvider.saveTravelerProfile({
        id: profileId,
        full_name: profileData.fullName,
        nickname: profileData.nickname,
        phone: profileData.phone,
        email: profileData.email,
        birth_date: profileData.birthDate,
        can_drive: profileData.canDrive,
        tags: profileData.tags,
        notes: profileData.notes
      });
      if (saved?.id) setProfileId(saved.id);
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      return;
    }
  }
  
  // Step 2 -> Step 3: Salvar vínculo se tripId existe
  if (step === 2 && tripId && profileId) {
    try {
      if (tripTravelerId) {
        await supabaseDataProvider.updateTripTraveler(tripTravelerId, {
          type: tripData.type,
          coupleId: tripData.coupleId,
          goesToSegments: tripData.goesToSegments,
          isPayer: tripData.isPayer,
          countInSplit: tripData.countInSplit
        });
      } else {
        const link = await supabaseDataProvider.linkTravelerToTrip({
          tripId,
          travelerProfileId: profileId,
          type: tripData.type,
          coupleId: tripData.coupleId,
          goesToSegments: tripData.goesToSegments,
          isPayer: tripData.isPayer,
          countInSplit: tripData.countInSplit
        });
        if (link?.id) setTripTravelerId(link.id);
      }
    } catch (error) {
      console.error('Erro ao vincular:', error);
      return;
    }
  }
  
  setStep(s => Math.min(s + 1, 3));
};
```

### 7. isStep1Valid FUNCTION (linhas ~115-119)
```typescript
// TROCAR:
const isStep1Valid = () => {
  if (!formData.fullName || !formData.fullName.trim()) return false;
  if ((formData.type === TravelerType.CHILD || formData.type === TravelerType.BABY) && !formData.birthDate) return false;
  return true;
};

// POR:
const isStep1Valid = () => {
  if (!profileData.fullName || !profileData.fullName.trim()) return false;
  if ((tripData.type === TravelerType.CHILD || tripData.type === TravelerType.BABY) && !profileData.birthDate) return false;
  return true;
};
```

### 8. STEP 1 JSX - Trocar todas referências de formData por profileData/tripData
- `formData.fullName` → `profileData.fullName`
- `formData.nickname` → `profileData.nickname`
- `formData.type` → `tripData.type`
- `formData.coupleId` → `tripData.coupleId`
- `formData.birthDate` → `profileData.birthDate`
- `formData.phone` → `profileData.phone`
- `formData.email` → `profileData.email`

### 9. STEP 2 JSX - Trocar referências
- `formData.goesToSegments` → `tripData.goesToSegments`
- `formData.isPayer` → `tripData.isPayer`
- `formData.canDrive` → `profileData.canDrive`
- `formData.tags` → `profileData.tags`
- `formData.notes` → `profileData.notes`

### 10. STEP 3 - Salvar documentos
Trocar chamadas de `dataProvider.saveTravelerDocument` por:
```typescript
await supabaseDataProvider.saveTravelerProfileDocument({
  travelerProfileId: profileId,
  docType: doc.docType,
  docCategory: doc.docCategory,
  docNumber: doc.docNumber,
  // ... outros campos
});
```

### 11. BOTÃO FINAL (linha ~900+)
```typescript
// TROCAR:
<Button onClick={() => onSave({...formData, documents} as Traveler)}>
  Salvar Viajante
</Button>

// POR:
<Button onClick={async () => {
  // Salvar documentos pendentes
  for (const doc of documents) {
    if (!doc.id && profileId) {
      await supabaseDataProvider.saveTravelerProfileDocument({
        travelerProfileId: profileId,
        ...doc
      });
    }
  }
  if (onDone && profileId) onDone(profileId);
}}>
  {existingProfileId ? 'Salvar Alterações' : 'Concluir'}
</Button>
```

## RESUMO DAS MUDANÇAS
1. Props: tripId opcional, existingProfileId, onDone
2. State: separar em profileData (global) e tripData (viagem)
3. Load: getTravelerProfileById + getTravelerProfileDocuments
4. Save Step 1: saveTravelerProfile
5. Save Step 2: linkTravelerToTrip ou updateTripTraveler
6. Save Step 3: saveTravelerProfileDocument
7. Nunca chamar dataProvider.getTravelers/saveTraveler
