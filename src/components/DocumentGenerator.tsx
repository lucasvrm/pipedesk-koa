import { useState } from 'react'
import { FileArrowDown, File, ShieldCheck, PenNib } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MasterDeal, PlayerTrack } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/helpers'
import { toast } from 'sonner'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
} from 'docx'

interface DocumentGeneratorProps {
  deal: MasterDeal
  playerTracks?: PlayerTrack[]
}

type TemplateType = 'teaser' | 'cim' | 'nda' | 'mandato'

export default function DocumentGenerator({ deal, playerTracks = [] }: DocumentGeneratorProps) {
  const [open, setOpen] = useState(false)
  const [templateType, setTemplateType] = useState<TemplateType>('teaser')
  const [isGenerating, setIsGenerating] = useState(false)

  const generateTeaser = () => {
    return new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: 'TEASER',
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              text: deal.clientName,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 600 },
            }),
            new Paragraph({
              text: 'Visão Geral',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Tipo de Operação: ', bold: true }),
                new TextRun(deal.operationType || 'N/A'),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Volume: ', bold: true }),
                new TextRun(formatCurrency(deal.volume)),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Prazo: ', bold: true }),
                new TextRun(deal.deadline ? formatDate(deal.deadline) : 'N/A'),
              ],
              spacing: { after: 300 },
            }),
            new Paragraph({
              text: 'Observações',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              text: deal.observations || 'Nenhuma observação disponível.',
              spacing: { after: 400 },
            }),
            new Paragraph({
              text: 'Players em Negociação',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            ...playerTracks.map(
              (track) =>
                new Paragraph({
                  children: [
                    new TextRun({ text: `${track.playerName}: `, bold: true }),
                    new TextRun(
                      `${formatCurrency(track.trackVolume)} - Estágio: ${track.currentStage} (${track.probability}%)`
                    ),
                  ],
                  spacing: { after: 100 },
                })
            ),
            new Paragraph({
              children: [
                new TextRun({
                  text: '\n\nDocumento gerado em ' + formatDate(new Date().toISOString()),
                  italics: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 600 },
            }),
          ],
        },
      ],
    })
  }

  const generateCIM = () => {
    return new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: 'CONFIDENTIAL INFORMATION MEMORANDUM',
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              text: deal.clientName,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 600 },
            }),
            new Paragraph({
              text: 'Executive Summary',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Operation Type: ', bold: true }),
                new TextRun(deal.operationType || 'N/A'),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Deal Volume: ', bold: true }),
                new TextRun(formatCurrency(deal.volume)),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Status: ', bold: true }),
                new TextRun(deal.status),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Deadline: ', bold: true }),
                new TextRun(deal.deadline ? formatDate(deal.deadline) : 'N/A'),
              ],
              spacing: { after: 300 },
            }),
            new Paragraph({
              text: 'Deal Description',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              text: deal.observations || 'No description available.',
              spacing: { after: 400 },
            }),
            new Paragraph({
              text: 'Confidentiality Notice',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 600, after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'This document contains confidential information intended only for the addressee. Unauthorized distribution or copying is strictly prohibited.',
                  italics: true,
                }),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Document generated on ' + formatDate(new Date().toISOString()),
                  italics: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 400 },
            }),
          ],
        },
      ],
    })
  }

  const generateNDA = () => {
    return new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: 'NON-DISCLOSURE AGREEMENT (NDA)',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'PARTES:', bold: true }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: `Este acordo é celebrado entre ${deal.clientName} e a parte receptora interessada na operação de ${deal.operationType}.`,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'OBJETO:', bold: true }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: 'O objetivo deste acordo é proteger as informações confidenciais compartilhadas durante a análise da oportunidade de investimento.',
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '\n\nDocumento gerado em ' + formatDate(new Date().toISOString()),
                italics: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 600 },
          }),
        ],
      }],
    })
  }

  const generateMandate = () => {
    return new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: 'MANDATO DE ASSESSORIA FINANCEIRA',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            text: deal.clientName,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'OBJETO:', bold: true }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: `Contratação de assessoria financeira para estruturação da operação do tipo ${deal.operationType} no valor estimado de ${formatCurrency(deal.volume)}.`,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'HONORÁRIOS (SUCCESS FEE):', bold: true }),
            ],
            spacing: { before: 200, after: 200 },
          }),
          new Paragraph({
            text: deal.feePercentage 
              ? `Os honorários de êxito serão de ${deal.feePercentage}% sobre o valor total captado.` 
              : 'Os honorários serão definidos em contrato específico.',
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Este documento é uma minuta preliminar. A assinatura digital será processada via integração Google Workspace.',
                italics: true,
                color: 'FF0000'
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400 },
          }),
        ],
      }],
    })
  }

  const handleGenerateDocument = async () => {
    setIsGenerating(true)

    try {
      let doc;
      switch (templateType) {
        case 'nda': doc = generateNDA(); break;
        case 'mandato': doc = generateMandate(); break;
        case 'cim': doc = generateCIM(); break;
        default: doc = generateTeaser();
      }

      const blob = await Packer.toBlob(doc)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${deal.clientName.replace(/\s+/g, '_')}_${templateType.toUpperCase()}_${
        new Date().toISOString().split('T')[0]
      }.docx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(`Documento ${templateType.toUpperCase()} gerado com sucesso!`)
      setOpen(false)
    } catch (error) {
      console.error('Error generating document:', error)
      toast.error('Erro ao gerar documento. Tente novamente.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileArrowDown className="mr-2" size={16} />
          Gerar Documento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Gerador de Documentos</DialogTitle>
          <DialogDescription>
            Selecione o tipo de documento que deseja gerar para este negócio
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[500px] pr-4">
          <div className="py-4">
            <RadioGroup value={templateType} onValueChange={(value: TemplateType) => setTemplateType(value)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* TEASER */}
                <div className="relative flex items-start space-x-3 rounded-md border p-4 hover:bg-accent cursor-pointer transition-colors h-full">
                  <RadioGroupItem value="teaser" id="teaser" className="mt-1" />
                  <Label htmlFor="teaser" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <File size={20} className="text-blue-500" />
                      <span className="font-semibold">Teaser</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Documento resumido (one-pager) com informações cegas e highlights do negócio.
                    </p>
                  </Label>
                </div>

                {/* NDA */}
                <div className="relative flex items-start space-x-3 rounded-md border p-4 hover:bg-accent cursor-pointer transition-colors h-full">
                  <RadioGroupItem value="nda" id="nda" className="mt-1" />
                  <Label htmlFor="nda" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck size={20} className="text-emerald-500" />
                      <span className="font-semibold">NDA</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Acordo de confidencialidade padrão para proteger informações sensíveis.
                    </p>
                  </Label>
                </div>

                {/* CIM */}
                <div className="relative flex items-start space-x-3 rounded-md border p-4 hover:bg-accent cursor-pointer transition-colors h-full">
                  <RadioGroupItem value="cim" id="cim" className="mt-1" />
                  <Label htmlFor="cim" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <File size={20} className="text-purple-500" />
                      <span className="font-semibold">CIM</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Memorando de oferta detalhado com análise financeira e descrição completa.
                    </p>
                  </Label>
                </div>

                {/* MANDATO */}
                <div className="relative flex items-start space-x-3 rounded-md border p-4 hover:bg-accent cursor-pointer transition-colors h-full">
                  <RadioGroupItem value="mandato" id="mandato" className="mt-1" />
                  <Label htmlFor="mandato" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <PenNib size={20} className="text-amber-500" />
                      <span className="font-semibold">Mandato</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Contrato de prestação de serviços de estruturação financeira.
                    </p>
                  </Label>
                </div>

              </div>
            </RadioGroup>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isGenerating}>
            Cancelar
          </Button>
          <Button onClick={handleGenerateDocument} disabled={isGenerating}>
            {isGenerating ? 'Gerando...' : 'Gerar Documento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}