import { CheckCircle2 } from 'lucide-react';
import { Section } from '../ui/Section';
import { SectionTitle } from '../ui/SectionTitle';
import { Container } from '../ui/Container';

export default function About() {
    const features = [
        "Support ongoing QCSP programs and events",
        "Propose and launch new initiatives",
        "Work in functional teams with real responsibilities",
        "Develop leadership, technical, and organizational skills",
        "Help shape the future of quantum education and community in the country"
    ];

    return (
        <Section id="about">
            <Container>
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <SectionTitle
                            centered={false}
                            subtitle="Young Quantum Leaders is an initiative where members:"
                        >
                            What is Young Quantum Leaders?
                        </SectionTitle>

                        <ul className="space-y-4 mb-8">
                            {features.map((feature, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <CheckCircle2 className="w-6 h-6 text-brand-blue flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-700 text-lg">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="bg-brand-blueLight/10 p-6 rounded-xl border border-brand-blueLight/20">
                            <p className="text-brand-blueDark font-medium text-lg leading-relaxed">
                                YQL runs year-round, with cohort-based recruitment and evolving projects.
                            </p>
                        </div>
                    </div>

                    <div className="relative">
                        {/* Placeholder for an image or geometric pattern - using a gradient box for now */}
                        <div className="aspect-square rounded-2xl bg-gradient-to-br from-brand-blue via-brand-purple to-brand-orange opacity-10 absolute inset-0 transform rotate-3 scale-105"></div>
                        <div className="aspect-square rounded-2xl bg-white border border-gray-100 shadow-xl relative z-10 p-8 flex items-center justify-center overflow-hidden">
                            {/* Decorative geometric elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/20 rounded-bl-full" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-blue/10 rounded-tr-full" />

                            <div className="text-center">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Build. Lead. Innovate.</h3>
                                <p className="text-gray-500">Shape the Quantum Future of the Philippines.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </Section>
    );
}
