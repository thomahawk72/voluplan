import { useState, useEffect } from 'react';
import { talentAPI, TalentKategori, Talent } from '../services/api';

export const useTalentData = () => {
  const [kategorier, setKategorier] = useState<TalentKategori[]>([]);
  const [talenter, setTalenter] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [kategoriData, talentData] = await Promise.all([
        talentAPI.getAllKategorier(),
        talentAPI.getAll(),
      ]);
      
      setKategorier(kategoriData.kategorier || []);
      setTalenter(talentData.talenter || []);
    } catch (err: any) {
      console.error('Feil ved lasting av data:', err);
      setError('Kunne ikke laste data. Vennligst prøv igjen.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createKategori = async (data: { navn: string; parentId?: number; beskrivelse?: string }) => {
    await talentAPI.createKategori(data);
    await fetchData();
  };

  const updateKategori = async (id: number, data: { navn?: string; parentId?: number; beskrivelse?: string }) => {
    await talentAPI.updateKategori(id, data);
    await fetchData();
  };

  const deleteKategori = async (id: number) => {
    await talentAPI.deleteKategori(id);
    await fetchData();
  };

  const createTalent = async (data: { navn: string; kategoriId: number; beskrivelse?: string }) => {
    await talentAPI.create(data);
    await fetchData();
  };

  const updateTalent = async (id: number, data: { navn?: string; kategoriId?: number; beskrivelse?: string }) => {
    await talentAPI.update(id, data);
    await fetchData();
  };

  const deleteTalent = async (id: number) => {
    await talentAPI.delete(id);
    await fetchData();
  };

  // Helper funksjoner
  const getRootKategorier = () => kategorier.filter(k => !k.parent_id);
  const getChildren = (parentId: number) => kategorier.filter(k => k.parent_id === parentId);
  const getTalenterForKategori = (kategoriId: number) => talenter.filter(t => t.kategori_id === kategoriId);
  
  const kategoriMedSubKategorier = new Set(kategorier.filter(k => k.parent_id !== null).map(k => k.parent_id));
  const kategoriSomKanHaTalenter = kategorier.filter(k => !kategoriMedSubKategorier.has(k.id));

  return {
    kategorier,
    talenter,
    loading,
    error,
    setError,
    createKategori,
    updateKategori,
    deleteKategori,
    createTalent,
    updateTalent,
    deleteTalent,
    getRootKategorier,
    getChildren,
    getTalenterForKategori,
    kategoriSomKanHaTalenter,
  };
};

