export interface ShapeProps {
    size?: number | string;
    className?: string;
}

export interface QuarterCircleProps extends ShapeProps {
    /** Direction the quarter circle faces: 'tl' | 'tr' | 'bl' | 'br' */
    direction?: 'tl' | 'tr' | 'bl' | 'br';
}

// Brand colors
export const BrandColors = {
    lightBlue: '#3986c0',
    darkBlue: '#396798',
    blue: '#3d8ccb',
    blueDark: '#396799',
    yellow: '#fed432',
    wine: '#bc594f',
    gray: '#97abc4',
};
