import { Section } from '../ui/Section';
import { SectionTitle } from '../ui/SectionTitle';
import { Container } from '../ui/Container';

export default function Apply() {
    const steps = [
        { stage: 0, title: "Choose a Functional Committee" },
        { stage: 1, title: "Submit your application form" },
        { stage: 2, title: "Demonstrate your skills" },
        { stage: 3, title: "Interview" },
        { stage: 4, title: "Onboarding" },
    ];

    return (
        <Section variant="gray" id="apply">
            <Container>
                <SectionTitle>How to Apply</SectionTitle>

                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col md:grid md:grid-cols-5 gap-8 md:gap-4">
                        {steps.map((step, index) => (
                            <div key={index} className="relative flex flex-col items-center">
                                {/* Connecting Line - Desktop Horizontal */}
                                {index < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-6 left-1/2 w-full h-1 bg-gray-200" />
                                )}

                                {/* Connecting Line - Mobile Vertical */}
                                {index < steps.length - 1 && (
                                    <div className="md:hidden absolute top-12 left-1/2 w-1 h-full bg-gray-200 transform -translate-x-1/2" />
                                )}

                                <div className="w-12 h-12 rounded-full bg-white border-4 border-brand-blue flex items-center justify-center font-bold text-brand-blueDark relative z-10 shadow-sm mb-4">
                                    {step.stage}
                                </div>

                                <h3 className="text-center font-bold text-gray-900 leading-tight">
                                    {step.title}
                                </h3>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 text-center">
                        <div className="inline-block bg-brand-yellow/10 text-brand-orange px-8 py-3 rounded-full font-bold text-lg animate-pulse">
                            Reach Stage 4 to be a YQL!
                        </div>
                    </div>
                </div>
            </Container>
        </Section>
    );
}
