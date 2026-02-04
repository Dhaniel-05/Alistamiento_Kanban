import { useState } from 'react';
import { FileText, FileSpreadsheet, FileSignature, BookOpenCheck, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem, DropdownMenuGroup, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from './ui/dropdown-menu';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { apiService } from '../../services/api';
import type { Ficha, Fase } from '../types';

interface GenerateDocumentMenuProps {
  ficha: Ficha | null;
  fases: Fase[];
  loadingFases?: boolean;
}

export function GenerateDocumentMenu({ ficha, fases, loadingFases }: GenerateDocumentMenuProps) {
  const [downloadingPhase, setDownloadingPhase] = useState<string | null>(null);

  const handlePlaneacionDownload = async (faseNombre: string) => {
    if (!ficha?.id_ficha) {
      toast.error('Selecciona una ficha antes de generar el documento');
      return;
    }

    try {
      setDownloadingPhase(faseNombre);
      await apiService.exportPlaneacionToExcel(ficha.id_ficha, faseNombre);
      toast.success(`Planeación pedagógica descargada (${faseNombre})`);
    } catch (error) {
      console.error('Error exportando planeación:', error);
      toast.error('No se pudo descargar la planeación');
    } finally {
      setDownloadingPhase(null);
    }
  };

  const handleUpcoming = (label: string) => {
    toast.info(`${label} estará disponible próximamente`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="bg-[#2E7D32] text-white hover:bg-[#246428] rounded-lg px-4 py-2"
          disabled={!ficha?.id_ficha || loadingFases}
        >
          {downloadingPhase ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileText className="w-4 h-4 mr-2" />
          )}
          GENERAR DOCUMENTO
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Documentos disponibles</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#2E7D32]" />
              Planeación Pedagógica
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Selecciona la fase a exportar
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {loadingFases ? (
                <DropdownMenuItem disabled className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando fases...
                </DropdownMenuItem>
              ) : fases.length === 0 ? (
                <DropdownMenuItem disabled>No hay fases configuradas</DropdownMenuItem>
              ) : (
                fases
                  .filter((fase) => fase.nombre !== 'Sin Asignar')
                  .map((fase) => (
                    <DropdownMenuItem
                      key={fase.id}
                      onSelect={() => {
                        handlePlaneacionDownload(fase.nombre);
                      }}
                      className="flex items-center gap-2"
                    >
                      {downloadingPhase === fase.nombre ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileSpreadsheet className="w-4 h-4 text-[#2E7D32]" />
                      )}
                      {fase.nombre}
                    </DropdownMenuItem>
                  ))
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => {
              handleUpcoming('Acta de alistamiento');
            }}
            className="flex items-center gap-2"
          >
            <FileSignature className="w-4 h-4 text-gray-500" />
            Acta de alistamiento
            <span className="ml-auto text-xs text-muted-foreground">Próximamente</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              handleUpcoming('Guía de aprendizaje');
            }}
            className="flex items-center gap-2"
          >
            <BookOpenCheck className="w-4 h-4 text-gray-500" />
            Guía de aprendizaje
            <span className="ml-auto text-xs text-muted-foreground">Próximamente</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

