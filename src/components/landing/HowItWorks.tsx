import { UserPlus, Briefcase, Lightbulb, Users, Flag } from 'lucide-react';
import { Section } from '../ui/Section';
import { SectionTitle } from '../ui/SectionTitle';
import { Container } from '../ui/Container';

export default function HowItWorks() {
    const steps = [
        {
            icon: UserPlus,
            title: "1. Join a Functional Committee",
            desc: "Applicants choose a committee aligned with their interests."
        },
        {
            icon: Briefcase,
            title: "2. Contribute to Ongoing Work",
            desc: "Members help execute current programs and initiatives and get familiarized with QCSP."
        },
        {
            icon: Lightbulb,
            title: "3. Propose New Ideas",
            desc: "Members pitch and lead new projects."
        },
        {
            icon: Users,
            title: "4. Self-Organized Teams",
            desc: "YQL members can form small teams to launch initiatives."
        },
        {
            icon: Flag,
            title: "5. Leadership Opportunities",
            desc: "Active members can become project or committee leads on major and flagship national events."
        }
    ];

    return (
        <Section variant="gray" id="how-it-works">
            <Container>
                <SectionTitle>How the Program Works</SectionTitle>

                <div className="relative">
                    {/* Connecting line for desktop */}
                    <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-0.5 bg-gray-200 transform -translate-x-1/2" />

                    <div className="space-y-8 md:space-y-12 relative z-10">
                        {steps.map((step, index) => (
                            <div key={index} className={`flex flex-col md:flex-row items-center gap-4 md:gap-8 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                                <div className="flex-1 w-full text-center md:text-left">
                                    <div className={`p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-brand-blue/30 transition-all ${index % 2 === 0 ? 'md:text-left' : 'md:text-right'}`}>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                                        <p className="text-gray-600">{step.desc}</p>
                                    </div>
                                </div>

                                <div className="relative flex-shrink-0 order-first md:order-none">
                                    <div className="w-12 h-12 bg-white rounded-full border-4 border-brand-blue flex items-center justify-center shadow-lg relative z-10">
                                        <step.icon className="w-5 h-5 text-brand-blueDark" />
                                    </div>
                                </div>

                                <div className="flex-1 w-full hidden md:block"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </Container>
        </Section>
    );
}
