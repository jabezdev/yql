import { GraduationCap, Briefcase, BookOpen, PenTool, Heart } from 'lucide-react';
import { Section } from '../ui/Section';
import { SectionTitle } from '../ui/SectionTitle';
import { Container } from '../ui/Container';

export default function WhoCanApply() {
    const audiences = [
        { icon: GraduationCap, text: "Students from any discipline" },
        { icon: Briefcase, text: "Young professionals" },
        { icon: BookOpen, text: "Educators and researchers" },
        { icon: PenTool, text: "Designers, developers, organizers, communicators" },
        { icon: Heart, text: "Anyone passionate about technology, science, or community-building" },
    ];

    return (
        <Section>
            <Container>
                <div className="max-w-4xl mx-auto">
                    <SectionTitle>Who Can Apply?</SectionTitle>

                    <div className="grid md:grid-cols-2 gap-6 mb-12">
                        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-brand-blue/30 transition-colors">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-brand-blue/5 to-transparent rounded-bl-full transition-transform group-hover:scale-110" />
                            <h3 className="text-xl font-bold mb-6 text-brand-blueDark">We welcome:</h3>
                            <ul className="space-y-4">
                                {audiences.map((item, index) => (
                                    <li key={index} className="flex items-center gap-3 text-gray-700">
                                        <item.icon className="w-5 h-5 text-brand-orange" />
                                        <span>{item.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-brand-blueDark text-white p-8 rounded-2xl flex flex-col justify-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

                            {/* Decorative circles */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-blue rounded-full opacity-20 blur-3xl"></div>
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-purple rounded-full opacity-20 blur-3xl"></div>

                            <div className="relative z-10">
                                <div className="text-4xl mb-4">👉</div>
                                <h3 className="text-2xl font-bold mb-4 text-white">No quantum background required for many roles.</h3>
                                <p className="text-brand-bgLight/90 mb-4 text-lg">
                                    We will train you within QCSP.
                                </p>
                                <p className="font-semibold text-brand-yellow text-xl">
                                    Curiosity, initiative, and reliability matter most.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </Section>
    );
}
