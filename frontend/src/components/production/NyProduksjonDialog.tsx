import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { ExpandMore, Schedule, Group, Event } from '@mui/icons-material';
import { produksjonAPI } from '../../services/api';

interface NyProduksjonDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const NyProduksjonDialog: React.FC<NyProduksjonDialogProps> = ({ open, onClose, onSuccess }) => {
  // Grunnleggende felt
  const [navn, setNavn] = useState('');
  const [dato, setDato] = useState('');
  const [tid, setTid] = useState('');
  const [sted, setSted] = useState('');
  const [beskrivelse, setBeskrivelse] = useState('');
  const [publisert, setPublisert] = useState(false);
  const [kategoriId, setKategoriId] = useState<number | ''>('');

  // Kategorier og mal-data
  const [kategorier, setKategorier] = useState<any[]>([]);
  const [komplettMal, setKomplettMal] = useState<any>(null);
  const [malLoading, setMalLoading] = useState(false);
  const [malHentet, setMalHentet] = useState(false);

  // Loading og error state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hent kategorier ved mount
  useEffect(() => {
    const fetchKategorier = async () => {
      try {
        const data = await produksjonAPI.getAllKategorier();
        setKategorier(data.kategorier);
      } catch (err) {
        console.error('Feil ved henting av kategorier:', err);
      }
    };

    if (open) {
      fetchKategorier();
    }
  }, [open]);

  // Reset state når dialogen lukkes
  useEffect(() => {
    if (!open) {
      setNavn('');
      setDato('');
      setTid('');
      setSted('');
      setBeskrivelse('');
      setPublisert(false);
      setKategoriId('');
      setKomplettMal(null);
      setMalHentet(false);
      setError(null);
    }
  }, [open]);

  const handleFyllUtBasertPåKategori = async (katId?: number) => {
    const idToUse = katId || kategoriId;
    if (!idToUse) return;

    setMalLoading(true);
    setError(null);
    try {
      const data = await produksjonAPI.getKomplettMal(idToUse as number);
      setKomplettMal(data);
      setMalHentet(true);

      // Populer felter fra kategori
      if (data.kategori.plassering && !sted) {
        setSted(data.kategori.plassering);
      }
    } catch (err) {
      console.error('Feil ved henting av kategori-mal:', err);
      setError('Kunne ikke hente mal fra kategori');
    } finally {
      setMalLoading(false);
    }
  };

  const handleOpprett = async () => {
    if (!navn || !dato || !tid) {
      setError('Navn, dato og tid er påkrevd');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Kombiner dato og tid til ISO string
      const tidspunkt = new Date(`${dato}T${tid}`).toISOString();

      await produksjonAPI.createProduksjon({
        navn,
        tid: tidspunkt,
        beskrivelse,
        publisert,
        plassering: sted || undefined,
        kategoriId: kategoriId || undefined,
        applyKategoriMal: malHentet, // Kopier kun hvis mal er hentet
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Feil ved opprettelse av produksjon:', err);
      setError(err.response?.data?.error || 'Kunne ikke opprette produksjon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Ny produksjon</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* Navn */}
          <TextField
            label="Navn på produksjon"
            value={navn}
            onChange={(e) => setNavn(e.target.value)}
            fullWidth
            required
          />

          {/* Dato og Tid */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Dato"
              type="date"
              value={dato}
              onChange={(e) => setDato(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />
            <TextField
              label="Starttid"
              type="time"
              value={tid}
              onChange={(e) => setTid(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />
          </Box>

          {/* Sted */}
          <TextField
            label="Sted"
            value={sted}
            onChange={(e) => setSted(e.target.value)}
            fullWidth
          />

          {/* Beskrivelse */}
          <TextField
            label="Beskrivelse"
            value={beskrivelse}
            onChange={(e) => setBeskrivelse(e.target.value)}
            multiline
            rows={3}
            fullWidth
          />

          {/* Publisert */}
          <FormControlLabel
            control={
              <Checkbox
                checked={publisert}
                onChange={(e) => setPublisert(e.target.checked)}
              />
            }
            label="Publisert (synlig for alle)"
          />

          {/* Produksjonskategori */}
          <FormControl fullWidth>
            <InputLabel>Produksjonskategori</InputLabel>
            <Select
              value={kategoriId}
              onChange={(e) => {
                const newKatId = e.target.value as number | '';
                setKategoriId(newKatId);
                setKomplettMal(null);
                setMalHentet(false);
                
                // Automatisk hent mal når kategori velges
                if (newKatId) {
                  handleFyllUtBasertPåKategori(newKatId);
                }
              }}
              label="Produksjonskategori"
            >
              <MenuItem value="">
                <em>Ingen kategori</em>
              </MenuItem>
              {kategorier.map((kat) => (
                <MenuItem key={kat.id} value={kat.id}>
                  {kat.navn}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Status for kategori-mal */}
          {kategoriId && (
            <Box>
              {malLoading && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} />
                    <Typography>Henter mal fra kategori...</Typography>
                  </Box>
                </Alert>
              )}

              {malHentet && !malLoading && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Mal hentet fra kategori ✓
                </Alert>
              )}

              {malHentet && komplettMal && (
                <Box sx={{ mt: 2 }}>
                  {/* Plan Accordion */}
                  {komplettMal.planMal && komplettMal.planMal.length > 0 && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Event color="primary" />
                          <Typography>
                            Plan ({komplettMal.planMal.length} elementer)
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {komplettMal.planMal
                            .filter((e: any) => e.type === 'overskrift')
                            .map((overskrift: any) => (
                              <Box key={overskrift.id}>
                                <ListItem>
                                  <ListItemText
                                    primary={overskrift.navn}
                                    primaryTypographyProps={{ fontWeight: 'bold' }}
                                  />
                                </ListItem>
                                {komplettMal.planMal
                                  .filter((h: any) => h.parent_id === overskrift.id)
                                  .map((hendelse: any) => (
                                    <ListItem key={hendelse.id} sx={{ pl: 4 }}>
                                      <ListItemText
                                        primary={`${hendelse.navn} (${hendelse.varighet_minutter} min)`}
                                      />
                                    </ListItem>
                                  ))}
                              </Box>
                            ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {/* Talenter Accordion */}
                  {komplettMal.talentMal && komplettMal.talentMal.length > 0 && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Group color="primary" />
                          <Typography>
                            Talenter ({komplettMal.talentMal.length} typer)
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {komplettMal.talentMal.map((talent: any) => (
                            <ListItem key={talent.id}>
                              <ListItemText
                                primary={talent.talent_navn}
                                secondary={`${talent.antall} person(er)${talent.beskrivelse ? ` - ${talent.beskrivelse}` : ''}`}
                              />
                              <Chip label={talent.talent_kategori} size="small" />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {/* Oppmøtetider Accordion */}
                  {komplettMal.oppmoteMal && komplettMal.oppmoteMal.length > 0 && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Schedule color="primary" />
                          <Typography>
                            Oppmøtetider ({komplettMal.oppmoteMal.length} tider)
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {komplettMal.oppmoteMal.map((oppmote: any) => (
                            <ListItem key={oppmote.id}>
                              <ListItemText
                                primary={oppmote.navn}
                                secondary={`${oppmote.minutter_før_start} minutter før start${oppmote.beskrivelse ? ` - ${oppmote.beskrivelse}` : ''}`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  )}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Avbryt
        </Button>
        <Button
          onClick={handleOpprett}
          variant="contained"
          disabled={loading || !navn || !dato || !tid}
        >
          {loading ? <CircularProgress size={20} /> : 'Opprett produksjon'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NyProduksjonDialog;

