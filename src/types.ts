import type { LucideIcon } from 'lucide-react';

// =============================================================================
// NAVIGATION
// =============================================================================

export interface NavLink {
    name: string;
    href: string;
}

// =============================================================================
// SOCIAL
// =============================================================================

export interface SocialLink {
    name: string;
    href: string;
    icon: LucideIcon;
}

// =============================================================================
// CONTENT CARDS
// =============================================================================

export interface MissionCard {
    icon: LucideIcon;
    title: string;
    description: string;
    gradientFrom: string;
    gradientTo: string;
}

export interface PerkItem {
    icon: LucideIcon;
    iconColor: string;
    title: string;
    description: string;
}

export interface ValuePillar {
    icon: LucideIcon;
    iconColor: string;
    label: string;
}

// =============================================================================
// TIMELINE
// =============================================================================

export interface TimelineStep {
    date: string;
    title: string;
    description: string;
}

// =============================================================================
// TEAMS
// =============================================================================

export interface TeamInfo {
    name: string;
    description: string;
    accentColor: string;
}

// =============================================================================
// FAQ
// =============================================================================

export interface FAQItem {
    question: string;
    answer: string;
}
