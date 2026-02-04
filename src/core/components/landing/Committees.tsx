import { Handshake, Calendar, BookOpen, User, Megaphone, Sprout, Code } from 'lucide-react';
import { Section } from '../ui/Section';
import { SectionTitle } from '../ui/SectionTitle';
import { Container } from '../ui/Container';
import { Card } from '../ui/Card';

export default function Committees() {
    const committees = [
        {
            name: "Partnerships",
            icon: Handshake,
            roles: ["Sponsorships Coordinator", "Grants & Proposals Writer", "Alumni & Network Coordinator", "External Affairs Officer", "Institutional Linkages Coordinator", "Community Linkages Coordinator"]
        },
        {
            name: "Event Operations",
            icon: Calendar,
            roles: ["Event Manager", "Logistics Coordinator", "Speaker Coordinator", "Volunteer Coordinator", "Tech/AV Support", "Venue & Facilities Coordinator", "Documentation Lead"]
        },
        {
            name: "Learning Experience",
            icon: BookOpen,
            roles: ["Curriculum Designer", "Workshop Facilitator", "Learning Materials Creator", "Assessment & Quiz Designer", "Educational Content Researcher", "Localization Lead", "Instructional Designer", "Learning Program Coordinator"]
        },
        {
            name: "Community Engagement",
            icon: User,
            roles: ["Community Moderator", "Outreach Organizer", "Member Experience Officer", "Feedback & Surveys Lead", "Community Events Coordinator"]
        },
        {
            name: "Communications & Marketing",
            icon: Megaphone,
            roles: ["Graphic Designer", "Social Media Manager", "Copywriter/Caption Writer", "Video Editor", "Content Strategist", "Website Content Manager", "PR & Media Relations Officer", "Brand Manager", "Newsletter Manager"]
        },
        {
            name: "Talent Development",
            icon: Sprout,
            roles: ["Recruitment Officer", "Onboarding Coordinator", "Training Program Designer", "Wellness & Culture Officer", "Performance Tracking Lead", "Leadership Development Coordinator", "Mentorship Program Manager", "Volunteer Engagement Officer"]
        },
        {
            name: "Products & Platform",
            icon: Code,
            roles: ["Web Developer (Frontend and Backend)", "UI/UX Designer", "Platform Manager", "Automation Builder", "Data Analyst", "Knowledge Base Manager", "QA/Tester", "Systems Administrator"]
        }
    ];

    return (
        <Section id="committees">
            <Container>
                <SectionTitle
                    subtitle="Applicants apply under a Functional Committee, then select preferred roles."
                >
                    Functional Committees & Roles
                </SectionTitle>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {committees.map((committee, index) => (
                        <Card key={index} className="h-full hover:border-brand-blue/40 transition-colors p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-brand-blueLight/20 flex items-center justify-center text-brand-blueDark">
                                    <committee.icon size={20} />
                                </div>
                                <h3 className="font-bold text-lg text-gray-900">{committee.name}</h3>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {committee.roles.map((role, rIndex) => (
                                    <span key={rIndex} className="inline-block px-2.5 py-1 bg-gray-50 text-gray-600 text-xs rounded-full border border-gray-100">
                                        {role}
                                    </span>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            </Container>
        </Section>
    );
}
