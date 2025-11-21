import { useState } from 'react'
import { FileArrowDown, File } from '@phosphor-icons/react'
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

type TemplateType = 'teaser' | 'cim'

export default function DocumentGenerator({ deal, playerTracks = [] }: DocumentGeneratorProps) {
  const [open, setOpen] = useState(false)
  const [templateType, setTemplateType] = useState<TemplateType>('teaser')
  const [isGenerating, setIsGenerating] = useState(false)

  const generateTeaser = () => {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Header
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

            // Deal Overview
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

            // Observations
            new Paragraph({
              text: 'Observações',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              text: deal.observations || 'Nenhuma observação disponível.',
              spacing: { after: 400 },
            }),

            // Player Tracks Summary
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

            // Footer
            new Paragraph({
              text: '\n\nDocumento gerado em ' + formatDate(new Date().toISOString()),
              alignment: AlignmentType.CENTER,
              spacing: { before: 600 },
              italics: true,
            }),
          ],
        },
      ],
    })

    return doc
  }

  const generateCIM = () => {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Header
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

            // Executive Summary
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

            // Deal Description
            new Paragraph({
              text: 'Deal Description',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              text: deal.observations || 'No description available.',
              spacing: { after: 400 },
            }),

            // Financial Overview
            new Paragraph({
              text: 'Financial Overview',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Total Deal Volume: ', bold: true }),
                new TextRun(formatCurrency(deal.volume)),
              ],
              spacing: { after: 100 },
            }),
            ...(deal.feePercentage
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Fee Percentage: ', bold: true }),
                      new TextRun(`${deal.feePercentage}%`),
                    ],
                    spacing: { after: 100 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Estimated Fee: ', bold: true }),
                      new TextRun(formatCurrency(deal.volume * (deal.feePercentage / 100))),
                    ],
                    spacing: { after: 300 },
                  }),
                ]
              : []),

            // Player Tracks
            new Paragraph({
              text: 'Active Negotiations',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            ...(playerTracks.length > 0
              ? playerTracks.flatMap((track) => [
                  new Paragraph({
                    text: track.playerName,
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 200, after: 100 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Track Volume: ', bold: true }),
                      new TextRun(formatCurrency(track.trackVolume)),
                    ],
                    spacing: { after: 100 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Current Stage: ', bold: true }),
                      new TextRun(track.currentStage),
                    ],
                    spacing: { after: 100 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Probability: ', bold: true }),
                      new TextRun(`${track.probability}%`),
                    ],
                    spacing: { after: 100 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Status: ', bold: true }),
                      new TextRun(track.status),
                    ],
                    spacing: { after: 200 },
                  }),
                ])
              : [
                  new Paragraph({
                    text: 'No active player tracks.',
                    spacing: { after: 200 },
                  }),
                ]),

            // Disclaimer
            new Paragraph({
              text: 'Confidentiality Notice',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 600, after: 200 },
            }),
            new Paragraph({
              text: 'This document contains confidential information intended only for the addressee. Unauthorized distribution or copying is strictly prohibited.',
              italics: true,
              spacing: { after: 200 },
            }),

            // Footer
            new Paragraph({
              text: 'Document generated on ' + formatDate(new Date().toISOString()),
              alignment: AlignmentType.CENTER,
              spacing: { before: 400 },
              italics: true,
            }),
          ],
        },
      ],
    })

    return doc
  }

  const handleGenerateDocument = async () => {
    setIsGenerating(true)

    try {
      const doc = templateType === 'teaser' ? generateTeaser() : generateCIM()

      // Generate and download the document
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerador de Documentos</DialogTitle>
          <DialogDescription>
            Selecione o tipo de documento que deseja gerar para este negócio
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <RadioGroup value={templateType} onValueChange={(value: TemplateType) => setTemplateType(value)}>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent cursor-pointer">
                <RadioGroupItem value="teaser" id="teaser" />
                <Label htmlFor="teaser" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <File size={20} />
                    <span className="font-semibold">Teaser</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Documento resumido com informações básicas do negócio e players em negociação
                  </p>
                </Label>
              </div>
              <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent cursor-pointer">
                <RadioGroupItem value="cim" id="cim" />
                <Label htmlFor="cim" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <File size={20} />
                    <span className="font-semibold">CIM (Confidential Information Memorandum)</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Documento detalhado com informações completas do negócio, análise financeira e disclaimers
                  </p>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>
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
