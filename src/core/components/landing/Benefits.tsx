import { Award, Briefcase, Globe, Users, Smile, Star } from 'lucide-react';
import { Section } from '../ui/Section';
import { SectionTitle } from '../ui/SectionTitle';
import { Container } from '../ui/Container';

export default function Benefits() {
    const benefits = [
        { icon: Award, text: "Real leadership experience" },
        { icon: Briefcase, text: "Portfolio-worthy projects" },
        { icon: Globe, text: "National and international exposure" },
        { icon: Users, text: "Professional network in deep tech" },
        { icon: Smile, text: "Mentorship and collaboration" },
        { icon: Star, text: "Opportunity to shape the country’s quantum ecosystem" },
    ];

    return (
        <Section variant="gray" className="overflow-hidden" id="benefits">
            <Container>
                <SectionTitle>What You Gain</SectionTitle>

                <div className="grid md:grid-cols-3 gap-6">
                    {benefits.map((benefit, index) => (
                        <div key={index} className="group relative bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/5 to-brand-purple/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="w-14 h-14 bg-brand-yellow/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 text-brand-orange">
                                    <benefit.icon size={28} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800">{benefit.text}</h3>
                            </div>
                        </div>
                    ))}
                </div>
            </Container>
        </Section>
    );
}
