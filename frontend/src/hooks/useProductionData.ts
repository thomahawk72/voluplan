import { useState, useEffect } from 'react';
import { produksjonAPI, Produksjon, Bemanning, ProduksjonsPlan } from '../services/api';

export const useProductionData = (id: string | undefined) => {
  const [produksjon, setProduksjon] = useState<Produksjon | null>(null);
  const [bemanning, setBemanning] = useState<Bemanning[]>([]);
  const [plan, setPlan] = useState<ProduksjonsPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const prodData = await produksjonAPI.getById(parseInt(id));
        setProduksjon(prodData.produksjon);
        
        const bemanningData = await produksjonAPI.getBemanning(parseInt(id));
        setBemanning(bemanningData.bemanning);
        
        if (prodData.produksjon.plan_id) {
          try {
            const planData = await produksjonAPI.getPlan(prodData.produksjon.plan_id);
            setPlan(planData.plan);
          } catch (err) {
            console.error('Kunne ikke hente plan:', err);
          }
        }
      } catch (err: any) {
        console.error('Feil ved lasting av produksjon:', err);
        setError('Kunne ikke laste produksjonsdata. Vennligst prøv igjen.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Beregn statistikk
  const bemanningStats = {
    totalt: bemanning.length,
    bekreftet: bemanning.filter(p => p.status === 'bekreftet').length,
    planlagt: bemanning.filter(p => p.status === 'planlagt').length,
    avlyst: bemanning.filter(p => p.status === 'avlyst').length,
    ikkeSvart: bemanning.filter(p => !p.status || p.status === 'ikke_svart').length,
  };

  // Grupper bemanning per talent kategori (øverste nivå)
  const bemanningPerKategori = bemanning.reduce((acc, person) => {
    const kategoriNavn = person.talent_kategori?.split(' → ')[0] || 'Ikke kategorisert';
    if (!acc[kategoriNavn]) {
      acc[kategoriNavn] = [];
    }
    acc[kategoriNavn].push(person);
    return acc;
  }, {} as Record<string, Bemanning[]>);

  return {
    produksjon,
    bemanning,
    plan,
    loading,
    error,
    bemanningStats,
    bemanningPerKategori,
  };
};

