import {
    Zap,
    Globe,
    Users,
    Target,
    Lightbulb,
    Rocket,
    Code,
    Calendar,
    Award,
    Github,
    Twitter,
    Linkedin,
    Facebook,
} from 'lucide-react';

import type {
    NavLink,
    SocialLink,
    MissionCard,
    PerkItem,
    ValuePillar,
    TimelineStep,
    TeamInfo,
    FAQItem,
} from '../types';

// =============================================================================
// NAVIGATION
// =============================================================================

export const NAV_LINKS: NavLink[] = [
    { name: 'About', href: '#about' },
    { name: 'Mission', href: '#mission' },
    { name: 'Program', href: '#program' },
    { name: 'Teams', href: '#teams' },
    { name: 'FAQ', href: '#faq' },
];

export const FOOTER_QUICK_LINKS: NavLink[] = [
    { name: 'About', href: '#about' },
    { name: 'Program', href: '#program' },
    { name: 'Teams', href: '#teams' },
    { name: 'Apply', href: '#apply' },
];

// =============================================================================
// SOCIAL
// =============================================================================

export const SOCIAL_LINKS: SocialLink[] = [
    { name: 'Facebook', href: '#', icon: Facebook },
    { name: 'Twitter', href: '#', icon: Twitter },
    { name: 'LinkedIn', href: '#', icon: Linkedin },
    { name: 'GitHub', href: '#', icon: Github },
];

// =============================================================================
// ABOUT SECTION
// =============================================================================

export const VALUE_PILLARS: ValuePillar[] = [
    { icon: Zap, iconColor: 'text-yql-red', label: 'Innovation' },
    { icon: Users, iconColor: 'text-yql-blue', label: 'Community' },
    { icon: Globe, iconColor: 'text-purple-500', label: 'Impact' },
];

// =============================================================================
// MISSION SECTION
// =============================================================================

export const MISSION_CARDS: MissionCard[] = [
    {
        icon: Target,
        title: 'Our Mission',
        description:
            'To cultivate a new generation of leaders equipped with the skills and vision to drive the quantum revolution in the Philippines.',
        gradientFrom: 'from-blue-900/40',
        gradientTo: 'to-slate-900',
    },
    {
        icon: Lightbulb,
        title: 'Our Vision',
        description:
            'A future where the Philippines is a key player in the global quantum landscape, powered by homegrown talent and innovation.',
        gradientFrom: 'from-slate-900',
        gradientTo: 'to-slate-800',
    },
    {
        icon: Rocket,
        title: 'Why YQL?',
        description:
            'We provide mentorship, resources, and a platform for students to lead real-world projects and make a tangible impact.',
        gradientFrom: 'from-red-900/40',
        gradientTo: 'to-slate-900',
    },
];

// =============================================================================
// EXPECTATIONS SECTION
// =============================================================================

export const PERKS: PerkItem[] = [
    {
        icon: Code,
        iconColor: 'text-yql-blue',
        title: 'Technical Workshops',
        description:
            'Hands-on training in quantum computing frameworks like Qiskit, Pennylane, and Cirq.',
    },
    {
        icon: Users,
        iconColor: 'text-yql-red',
        title: 'Mentorship',
        description:
            'Direct guidance from industry experts and researchers in the field of quantum technologies.',
    },
    {
        icon: Calendar,
        iconColor: 'text-purple-500',
        title: 'Exclusive Events',
        description:
            'Access to closed-door seminars, networking events, and international conferences.',
    },
    {
        icon: Award,
        iconColor: 'text-yellow-400',
        title: 'Certification',
        description:
            'Receive a certificate of completion and recognition as a Quantum Leader upon graduation.',
    },
];

// =============================================================================
// TIMELINE SECTION
// =============================================================================

export const TIMELINE_STEPS: TimelineStep[] = [
    {
        date: 'August 2025',
        title: 'Applications Open',
        description: 'Submit your application and portfolio through our online portal.',
    },
    {
        date: 'September 2025',
        title: 'Screening & Interviews',
        description: 'Shortlisted candidates will be invited for a series of interviews.',
    },
    {
        date: 'October 2025',
        title: 'Onboarding',
        description: 'Welcome ceremony and initial team bonding activities.',
    },
    {
        date: 'Nov 2025 - May 2026',
        title: 'The Program',
        description: 'Workshops, projects, and leadership training sessions.',
    },
    {
        date: 'June 2026',
        title: 'Graduation',
        description: 'Present your final projects and officially join the QCSP alumni network.',
    },
];

// =============================================================================
// TEAMS SECTION
// =============================================================================

export const TEAMS: TeamInfo[] = [
    {
        name: 'Research & Development',
        description:
            'Dive deep into quantum algorithms, hardware simulations, and theoretical research.',
        accentColor: 'bg-yql-blue',
    },
    {
        name: 'Product & Engineering',
        description:
            'Build the platforms and tools that power the community and our projects.',
        accentColor: 'bg-yql-red',
    },
    {
        name: 'Marketing & Strategy',
        description:
            'Shape the narrative and reach of quantum computing in the Philippines.',
        accentColor: 'bg-purple-600',
    },
    {
        name: 'Community Management',
        description:
            'Engage with members, organize events, and foster a thriving inclusive environment.',
        accentColor: 'bg-yellow-500',
    },
];

// =============================================================================
// FAQ SECTION
// =============================================================================

export const FAQS: FAQItem[] = [
    {
        question: 'Who can apply for YQL?',
        answer:
            'YQL is open to all Filipino undergraduate students who are passionate about quantum computing, regardless of their major or background.',
    },
    {
        question: 'Is prior knowledge of quantum computing required?',
        answer:
            'No! We welcome beginners. However, a curiosity to learn and a basic understanding of mathematics and programming (Python) is recommended.',
    },
    {
        question: 'How long is the program?',
        answer:
            'The program spans one academic year, starting from October and concluding in June of the following year.',
    },
    {
        question: 'Is this a paid program?',
        answer:
            'YQL is a volunteer student leadership program. While unpaid, it offers invaluable mentorship, networking, and skill-building opportunities.',
    },
];

// =============================================================================
// ICON COLOR MAP (for dynamic icon coloring)
// =============================================================================

export const ICON_COLORS = {
    blue: 'text-yql-blue',
    red: 'text-yql-red',
    purple: 'text-purple-500',
    yellow: 'text-yellow-400',
} as const;
