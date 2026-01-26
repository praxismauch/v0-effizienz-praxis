"use client"

import { HelpCircle, ThumbsUp, ThumbsDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { FAQ } from "../types"

interface FAQTabProps {
  faqs: FAQ[]
}

export function FAQTab({ faqs }: FAQTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Häufig gestellte Fragen</CardTitle>
        <CardDescription>Schnelle Antworten auf die wichtigsten Fragen</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id}>
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="flex items-center gap-3">
                  <HelpCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  {faq.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pl-7">
                <p className="text-muted-foreground mb-3">{faq.answer}</p>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">War das hilfreich?</span>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <ThumbsUp className="h-3 w-3 mr-1" />
                    {faq.helpful}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <ThumbsDown className="h-3 w-3" />
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}
