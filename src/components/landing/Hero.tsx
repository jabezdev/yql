import { Container, Button, GeometricPattern } from '../ui';
import {
    BlueStar,
    YellowBox,
    YellowQuarter,
    WineFrame,
    LightBlueDiagonal,
    GreyQuarter,
    BlueCutout,
    BlueQuarter,
} from '../ui/GeometricShapes';

const SHAPE_SIZE = 80;

// Reusable shape wrapper to ensure consistent sizing
const Shape: React.FC<{ component: React.ElementType; direction?: string; size?: number, className?: string }> = ({
    component: Component,
    direction,
    size = SHAPE_SIZE,
    className = ''
}) => (
    <div className={`flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
        <Component size={size} direction={direction} className="w-full h-full" />
    </div>
);

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center bg-brand-bgLight pt-[72px] overflow-hidden">
            {/* Subtle Gray Gradient Background */}
            <div
                className="absolute inset-0"
                style={{
                    background: `
                        radial-gradient(circle at 10% 20%, rgba(240, 242, 245, 1) 0%, rgba(220, 225, 230, 0.4) 90%),
                        linear-gradient(120deg, #f5f6f8 0%, #e8eef4 100%)
                    `
                }}
            />

            {/* Geometric Border Frame - Responsive Layout */}
            {/* Adjusted padding-top to start exactly below navbar (72px) and removed bottom padding */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-10 pt-[72px] pb-0 px-0 md:px-0">
                {/* Mobile Top Strip */}
                <div className="md:hidden w-full opacity-60">
                    <GeometricPattern variant="footer-strip" size={60} />
                </div>

                {/* DESKTOP LAYOUT (Hidden on mobile) */}
                <div className="hidden md:flex flex-col h-full justify-between w-full">
                    {/* TOP ROW */}
                    <div className="flex justify-between items-start w-full">
                        <div className="hidden md:block">
                            <GeometricPattern variant="hero-top-left" size={SHAPE_SIZE} />
                        </div>
                        <div className="hidden lg:flex">
                            <Shape component={YellowQuarter} direction="tl" size={SHAPE_SIZE} />
                            <Shape component={YellowBox} size={SHAPE_SIZE} />
                            <Shape component={YellowQuarter} direction="tr" size={SHAPE_SIZE} />
                            <Shape component={BlueQuarter} direction="br" size={SHAPE_SIZE} />
                        </div>
                        <div className="hidden md:block">
                            <GeometricPattern variant="hero-top-right" size={SHAPE_SIZE} />
                        </div>
                    </div>

                    {/* MIDDLE SECTION */}
                    <div className="flex justify-between items-center flex-1 w-full px-0">
                        <div className="hidden md:flex flex-col h-full justify-center space-y-0">
                            <GeometricPattern variant="sidebar-left" size={SHAPE_SIZE} />
                        </div>
                        <div className="hidden md:flex flex-col h-full justify-center items-end space-y-0">
                            <GeometricPattern variant="sidebar-left" className="rotate-180" size={SHAPE_SIZE} />
                        </div>
                    </div>

                    {/* BOTTOM ROW */}
                    <div className="flex justify-between items-end w-full">
                        <div className="hidden md:block">
                            <GeometricPattern variant="hero-bottom-left" size={SHAPE_SIZE} />
                        </div>
                        <div className="flex items-end mx-auto">
                            <div className="hidden lg:flex">
                                <Shape component={GreyQuarter} direction="bl" size={SHAPE_SIZE} />
                                <Shape component={LightBlueDiagonal} direction="tr" size={SHAPE_SIZE} />
                                <Shape component={YellowBox} size={SHAPE_SIZE} />
                            </div>
                            <Shape component={BlueStar} className="hidden sm:block" size={SHAPE_SIZE} />
                            <div className="hidden lg:flex">
                                <Shape component={YellowBox} size={SHAPE_SIZE} />
                                <Shape component={LightBlueDiagonal} direction="tl" size={SHAPE_SIZE} />
                                <Shape component={GreyQuarter} direction="br" size={SHAPE_SIZE} />
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <GeometricPattern variant="hero-bottom-right" size={SHAPE_SIZE} />
                        </div>
                    </div>
                </div>

                {/* Mobile Bottom Strip */}
                <div className="md:hidden w-full opacity-60">
                    <GeometricPattern variant="footer-strip" size={60} />
                </div>
            </div>

            {/* Content w/ Oval Mask Background behind text for legibility */}
            <Container className="relative z-30 text-center">
                {/* Oval mask gradient strictly for content area */}
                <div
                    className="absolute inset-0 pointer-events-none -z-10 blur-xl scale-125"
                    style={{
                        background: `radial-gradient(ellipse 60% 50% at 50% 50%, 
                            rgba(255, 255, 255, 0.9) 0%, 
                            rgba(255, 255, 255, 0.6) 50%,
                            rgba(255, 255, 255, 0) 100%)`,
                    }}
                />

                <div className="max-w-4xl mx-auto py-20 relative">
                    {/* Main Heading */}
                    {/* Main Heading (Swapped Emphasis) */}
                    <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight leading-tight text-brand-blueDark font-sans">
                        Join our Team, Be a
                    </h1>

                    {/* Subheading (Swapped Emphasis - Now Larger) */}
                    <p className="text-5xl md:text-7xl mb-12 font-bold tracking-tight text-brand-wine">
                        Young Quantum Leader
                    </p>

                    {/* Description */}
                    <p className="text-lg md:text-xl text-brand-darkBlue/80 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
                        Join the premier youth leadership program by the Quantum Computing
                        Society of the Philippines. Lead, innovate, and inspire the next
                        generation of quantum pioneers.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Button
                            as="a"
                            href="#apply"
                            variant="geometric-primary"
                            size="lg"
                        >
                            Apply Now
                        </Button>
                        <Button
                            as="a"
                            href="#about"
                            variant="geometric-secondary"
                            size="lg"
                        >
                            Learn More →
                        </Button>
                    </div>
                </div>
            </Container>
        </section>
    );
}
