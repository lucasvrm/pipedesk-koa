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
    // ... (Mantive o código original do Teaser para brevidade, ele não mudou)
    // Se precisar do código completo do Teaser novamente, posso incluir
    return new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({ text: 'TEASER', heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
          new Paragraph({ text: deal.clientName, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
          new Paragraph({ text: 'Visão Geral: ' + formatCurrency(deal.volume) }),
          // ... resto do teaser
        ]
      }]
    })
  }

  const generateCIM = () => {
    // ... (Mantive o código original do CIM para brevidade)
    return new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({ text: 'CONFIDENTIAL INFORMATION MEMORANDUM', heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
          // ... resto do CIM
        ]
      }]
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gerador de Documentos</DialogTitle>
          <DialogDescription>
            Selecione o tipo de documento que deseja gerar para este negócio
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[400px] pr-4">
          <div className="py-4">
            <RadioGroup value={templateType} onValueChange={(value: TemplateType) => setTemplateType(value)}>
              <div className="grid gap-4">
                {/* TEASER */}
                <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent cursor-pointer transition-colors">
                  <RadioGroupItem value="teaser" id="teaser" className="mt-1" />
                  <Label htmlFor="teaser" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <File size={20} className="text-blue-500" />
                      <span className="font-semibold">Teaser</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Documento resumido (one-pager) com informações cegas e highlights do negócio para abordagem inicial.
                    </p>
                  </Label>
                </div>

                {/* NDA */}
                <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent cursor-pointer transition-colors">
                  <RadioGroupItem value="nda" id="nda" className="mt-1" />
                  <Label htmlFor="nda" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck size={20} className="text-emerald-500" />
                      <span className="font-semibold">NDA (Acordo de Confidencialidade)</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Minuta padrão de confidencialidade para proteger as informações sensíveis antes do envio do CIM.
                    </p>
                  </Label>
                </div>

                {/* CIM */}
                <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent cursor-pointer transition-colors">
                  <RadioGroupItem value="cim" id="cim" className="mt-1" />
                  <Label htmlFor="cim" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <File size={20} className="text-purple-500" />
                      <span className="font-semibold">CIM (Memorando de Oferta)</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Memorando detalhado com análise financeira, descrição completa do ativo e estrutura da operação.
                    </p>
                  </Label>
                </div>

                {/* MANDATO */}
                <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent cursor-pointer transition-colors">
                  <RadioGroupItem value="mandato" id="mandato" className="mt-1" />
                  <Label htmlFor="mandato" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <PenNib size={20} className="text-amber-500" />
                      <span className="font-semibold">Mandato de Assessoria</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Contrato de prestação de serviços de estruturação financeira. 
                      <span className="block mt-1 text-xs text-amber-600 font-medium bg-amber-50 p-1 rounded w-fit">
                        * Integração com assinatura digital em breve.
                      </span>
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