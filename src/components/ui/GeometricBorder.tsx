import React from 'react';
import {
    BlueStar,
    YellowBox,
    YellowQuarter,
    WineFrame,
    LightBlueDiagonal,
    GreyQuarter,
    BlueCutout,
    BlueQuarter,
} from './GeometricShapes';

interface GeometricBorderProps {
    children: React.ReactNode;
    className?: string;
}

const SHAPE_SIZE = 80;

/**
 * Top row shapes (left to right) based on reference image
 */
const TopRow: React.FC = () => (
    <div className="flex justify-between items-start">
        {/* Top Left Corner */}
        <div className="flex">
            <BlueCutout size={SHAPE_SIZE} direction="tl" />
            <YellowQuarter size={SHAPE_SIZE} direction="tr" />
            <BlueStar size={SHAPE_SIZE} />
        </div>

        {/* Top Center */}
        <div className="flex">
            <YellowQuarter size={SHAPE_SIZE} direction="tl" />
            <YellowBox size={SHAPE_SIZE} />
            <YellowQuarter size={SHAPE_SIZE} direction="tr" />
        </div>

        {/* Top Right Corner */}
        <div className="flex">
            <BlueStar size={SHAPE_SIZE} />
            <YellowQuarter size={SHAPE_SIZE} direction="tl" />
            <BlueCutout size={SHAPE_SIZE} direction="tr" />
        </div>
    </div>
);

/**
 * Bottom row shapes (left to right) based on reference image
 */
const BottomRow: React.FC = () => (
    <div className="flex justify-between items-end">
        {/* Bottom Left Corner */}
        <div className="flex flex-col">
            <div className="flex">
                <YellowQuarter size={SHAPE_SIZE} direction="bl" />
                <WineFrame size={SHAPE_SIZE} />
            </div>
        </div>

        {/* Bottom Center */}
        <div className="flex items-end">
            <GreyQuarter size={SHAPE_SIZE} direction="bl" />
            <LightBlueDiagonal size={SHAPE_SIZE} direction="tr" />
            <BlueStar size={SHAPE_SIZE} />
            <LightBlueDiagonal size={SHAPE_SIZE} direction="tl" />
            <GreyQuarter size={SHAPE_SIZE} direction="br" />
        </div>

        {/* Bottom Right Corner */}
        <div className="flex flex-col items-end">
            <div className="flex">
                <WineFrame size={SHAPE_SIZE} />
                <YellowQuarter size={SHAPE_SIZE} direction="br" />
            </div>
        </div>
    </div>
);

/**
 * Left side shapes (top to bottom) based on reference image
 */
const LeftSide: React.FC = () => (
    <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between py-20">
        {/* Upper left area */}
        <div className="flex flex-col">
            <WineFrame size={SHAPE_SIZE} />
            <YellowBox size={SHAPE_SIZE} />
        </div>

        {/* Middle left */}
        <div className="flex flex-col">
            <YellowQuarter size={SHAPE_SIZE} direction="tr" />
            <YellowQuarter size={SHAPE_SIZE} direction="br" />
        </div>

        {/* Lower left */}
        <div className="flex flex-col">
            <BlueQuarter size={SHAPE_SIZE} direction="tr" />
            <BlueQuarter size={SHAPE_SIZE} direction="br" />
        </div>
    </div>
);

/**
 * Right side shapes (top to bottom) based on reference image
 */
const RightSide: React.FC = () => (
    <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between py-20">
        {/* Upper right area */}
        <div className="flex flex-col items-end">
            <WineFrame size={SHAPE_SIZE} />
            <YellowBox size={SHAPE_SIZE} />
        </div>

        {/* Middle right */}
        <div className="flex flex-col items-end">
            <YellowQuarter size={SHAPE_SIZE} direction="tl" />
            <YellowQuarter size={SHAPE_SIZE} direction="bl" />
        </div>

        {/* Lower right */}
        <div className="flex flex-col items-end">
            <GreyQuarter size={SHAPE_SIZE} direction="tl" />
            <GreyQuarter size={SHAPE_SIZE} direction="bl" />
        </div>
    </div>
);

/**
 * A full-page geometric border frame that wraps content
 */
export const GeometricBorder: React.FC<GeometricBorderProps> = ({
    children,
    className = '',
}) => {
    return (
        <div className={`relative min-h-screen overflow-hidden ${className}`}>
            {/* Background pattern */}
            <div
                className="absolute inset-0 opacity-30"
                style={{
                    backgroundImage: `
            linear-gradient(135deg, rgba(200, 210, 220, 0.3) 25%, transparent 25%),
            linear-gradient(225deg, rgba(200, 210, 220, 0.3) 25%, transparent 25%),
            linear-gradient(45deg, rgba(200, 210, 220, 0.3) 25%, transparent 25%),
            linear-gradient(315deg, rgba(200, 210, 220, 0.3) 25%, transparent 25%)
          `,
                    backgroundSize: '60px 60px',
                    backgroundPosition: '0 0, 30px 0, 30px -30px, 0 30px',
                }}
            />

            {/* Geometric border elements */}
            <div className="absolute inset-0 pointer-events-none z-10">
                {/* Top Row */}
                <div className="absolute top-0 left-0 right-0">
                    <TopRow />
                </div>

                {/* Left Side */}
                <LeftSide />

                {/* Right Side */}
                <RightSide />

                {/* Bottom Row */}
                <div className="absolute bottom-0 left-0 right-0">
                    <BottomRow />
                </div>
            </div>

            {/* Main content */}
            <div className="relative z-20">
                {children}
            </div>
        </div>
    );
};

export default GeometricBorder;
