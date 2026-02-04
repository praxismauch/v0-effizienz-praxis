"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollReveal, StaggeredReveal } from "@/components/scroll-reveal"
import { features } from "../features-data"

export function FeaturesSection() {
  return (
    <section id="features" className="w-full py-16 md:py-24 bg-background">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center space-y-4 mb-12">
          <ScrollReveal variant="fadeDown" delay={100}>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Alle Funktionen für Ihre Praxis
            </h2>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp" delay={200}>
            <p className="text-xl text-muted-foreground mx-auto">
              Eine Komplettlösung, die alle Bereiche Ihrer Praxis abdeckt
            </p>
          </ScrollReveal>
        </div>
        <StaggeredReveal
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          variant="scaleUp"
          staggerDelay={50}
          duration={500}
        >
          {features.map((feature, index) => (
            <Link href={feature.link} key={index}>
              <Card
                className="group cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm
                  hover:shadow-lg hover:shadow-primary/5 hover:border-primary/40 hover:-translate-y-1
                  transition-all duration-300 ease-out"
              >
                <CardContent className="p-5 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div
                      className={`flex items-center justify-center w-16 h-16 rounded-xl
                      ${feature.color.split(" ")[0]}
                      group-hover:scale-110 group-hover:rotate-3
                      transition-all duration-300 ease-out`}
                    >
                      <feature.icon
                        className={`h-9 w-9 ${feature.color.split(" ")[1]} group-hover:scale-110 transition-transform duration-300`}
                      />
                    </div>
                    <h3 className="font-semibold text-base group-hover:text-primary transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </StaggeredReveal>
      </div>
    </section>
  )
}
