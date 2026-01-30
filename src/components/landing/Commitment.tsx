import { Clock, Laptop, Target, BarChart, TrendingUp } from 'lucide-react';
import { Section } from '../ui/Section';
import { SectionTitle } from '../ui/SectionTitle';
import { Container } from '../ui/Container';

export default function Commitment() {
    const commitments = [
        { icon: Clock, text: "Flexible and project-based" },
        { icon: Laptop, text: "Remote-first" },
        { icon: Target, text: "Output-focused rather than time-based" },
        { icon: BarChart, text: "Members choose how much to take on" }
    ];

    const pathways = [
        "Project Leads",
        "Committee Leads",
        "National Initiative Leads",
        "Mentors for new cohorts",
        "Core QCSP leadership roles"
    ];

    return (
        <Section id="commitment">
            <Container>
                <div className="grid lg:grid-cols-2 gap-16">
                    <div>
                        <SectionTitle centered={false}>Commitment</SectionTitle>
                        <div className="grid sm:grid-cols-2 gap-6">
                            {commitments.map((item, index) => (
                                <div key={index} className="flex flex-col gap-3 p-5 bg-gray-50 rounded-xl border border-gray-100 hover:border-brand-blue/30 transition-colors">
                                    <item.icon className="text-brand-blueDark w-8 h-8" />
                                    <span className="font-medium text-gray-800">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <SectionTitle centered={false}>Growth Pathways</SectionTitle>
                        <div className="bg-brand-blueDark text-white p-8 rounded-2xl relative overflow-hidden">
                            {/* Decorative background */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                            <h3 className="text-xl font-medium mb-6 relative z-10">Members can grow into:</h3>
                            <ul className="space-y-4 relative z-10">
                                {pathways.map((path, index) => (
                                    <li key={index} className="flex items-center gap-3">
                                        <TrendingUp className="text-brand-yellow w-5 h-5 flex-shrink-0" />
                                        <span className="text-lg text-brand-bgLight/90">{path}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </Container>
        </Section>
    );
}
