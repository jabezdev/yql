import { Section } from '../ui/Section';
import { SectionTitle } from '../ui/SectionTitle';
import { Container } from '../ui/Container';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Loader2 } from 'lucide-react';

export default function Apply() {
    const navigate = useNavigate();
    // Fetch active recruitment programs (publicly visible)
    const activeProgram = useQuery(api.engine.programs.getActiveProgram);

    // Hardcoded steps for display - in future this could be dynamic from Program Stage Config
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
                    <div className="flex flex-col md:grid md:grid-cols-5 gap-8 md:gap-4 mb-12">
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

                    <div className="text-center">
                        <div className="inline-block bg-brand-yellow/10 text-brand-orange px-8 py-3 rounded-full font-bold text-lg animate-pulse mb-8">
                            Reach Stage 4 to be a YQL!
                        </div>

                        <div className="space-y-4">
                            {activeProgram === undefined ? (
                                <div className="flex justify-center"><Loader2 className="animate-spin text-brand-blue" /></div>
                            ) : activeProgram ? (
                                <div>
                                    <h3 className="text-xl font-bold mb-4 text-brand-darkBlue">
                                        Applications Open: {activeProgram.name}
                                    </h3>
                                    <p className="text-brand-textMuted mb-6 max-w-lg mx-auto">
                                        {activeProgram.description || "The recruitment season is officially open. Start your journey with us today."}
                                    </p>
                                    <Button
                                        onClick={() => navigate('/login')} // Login first, then UnifiedDashboard directs to Onboarding/Recruitment
                                        variant="geometric-primary"
                                        size="lg"
                                    >
                                        Apply Now for {activeProgram.name}
                                    </Button>
                                </div>
                            ) : (
                                <div className="bg-gray-100 p-6 rounded-xl border border-gray-200 inline-block">
                                    <p className="text-gray-600 font-medium">
                                        There are currently no active recruitment programs.
                                    </p>
                                    <p className="text-sm text-gray-500 mt-2">
                                        Please check back later or follow our social media for updates.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Container>
        </Section>
    );
}
