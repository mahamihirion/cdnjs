import { StaggerConfig, HandleEnterUpdateDelete, OnFlipperComplete, FlippedProps } from './types';
import { SpringOption } from './springSettings/types';
declare class Flipper {
    private element;
    private staggerConfig;
    private applyTransformOrigin;
    private handleEnterUpdateDelete;
    private debug?;
    private spring;
    private inProgressAnimations;
    private flipCallbacks;
    private snapshot;
    private onComplete?;
    private onStart?;
    constructor(options: {
        element: HTMLElement;
        staggerConfig: StaggerConfig;
        spring: SpringOption;
        applyTransformOrigin: boolean;
        handleEnterUpdateDelete: HandleEnterUpdateDelete;
        debug: boolean;
        onComplete: OnFlipperComplete;
    });
    recordBeforeUpdate(): void;
    update(prevDecisionData: any, currentDecisionData: any): void;
    addFlipped({ element, flipId, opacity, translate, scale, transformOrigin, spring, stagger, delayUntil, onAppear, onStart, onSpringUpdate, onComplete, onExit, shouldFlip, shouldInvert }: FlippedProps & {
        element: HTMLElement;
    }): void;
    addInverted({ element, parent, opacity, translate, scale, transformOrigin }: {
        element: HTMLElement;
        parent: HTMLElement;
        opacity: boolean;
        translate: boolean;
        scale: boolean;
        transformOrigin: string;
    }): void;
}
export default Flipper;
