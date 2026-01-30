import { Target, Users, Zap, Globe, Lightbulb } from 'lucide-react';
import { Section } from '../ui/Section';
import { SectionTitle } from '../ui/SectionTitle';
import { Container } from '../ui/Container';
import { Card } from '../ui/Card';

export default function Mission() {
    const missionPoints = [
        {
            icon: Lightbulb,
            text: "Advance quantum awareness and education"
        },
        {
            icon: Users,
            text: "Build strong academic and industry linkages"
        },
        {
            icon: Zap,
            text: "Create impactful programs and platforms"
        },
        {
            icon: Globe,
            text: "Strengthen the national quantum ecosystem"
        },
        {
            icon: Target,
            text: "Inspire more Filipinos to enter quantum and deep tech"
        }
    ];

    return (
        <Section variant="gray" id="mission">
            <Container>
                <SectionTitle
                    subtitle="To develop a new generation of leaders who will:"
                >
                    Mission
                </SectionTitle>

                <div className="grid md:grid-cols-3 gap-6">
                    {missionPoints.map((point, index) => (
                        <Card key={index} className="p-6 flex flex-col items-center text-center h-full hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-brand-blue/10 rounded-full flex items-center justify-center mb-4 text-brand-blue">
                                <point.icon size={24} />
                            </div>
                            <p className="text-lg font-medium text-gray-800">{point.text}</p>
                        </Card>
                    ))}
                </div>
            </Container>
        </Section>
    );
}
