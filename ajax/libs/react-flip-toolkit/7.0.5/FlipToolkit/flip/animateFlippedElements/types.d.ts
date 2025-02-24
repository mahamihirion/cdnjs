import { BaseFlipArgs, FlippedIds } from '../types';
import { SpringOption, SpringConfig } from '../../springSettings/types';
import { StaggerConfig, OnFlipperComplete, FlipId } from '../../types';
import { SerializableFlippedProps } from '../../types';
import { Spring } from '../../forked-rebound/types';
export declare type ScopedSelector = (selector: string) => HTMLElement[];
export interface AnimateFlippedElementsArgs extends BaseFlipArgs {
    flippedIds: FlippedIds;
    applyTransformOrigin: boolean;
    spring: SpringOption;
    debug: boolean;
    staggerConfig: StaggerConfig;
    decisionData: any;
    scopedSelector: ScopedSelector;
    onComplete: OnFlipperComplete;
    containerEl: HTMLElement;
}
export declare type OnUpdate = (spring: Spring) => void;
export declare type GetOnUpdateFunc = ({ spring, onAnimationEnd }: {
    spring: Spring;
    onAnimationEnd: () => void;
}) => OnUpdate;
export declare type Matrix = number[];
export declare type InvertedChild = [HTMLElement, Omit<SerializableFlippedProps, 'flipId'>];
export declare type InvertedChildren = InvertedChild[];
export interface AnimatedVals {
    matrix: Matrix;
    opacity?: number;
}
export declare type InitializeFlip = () => void;
export declare type ChildIds = string[];
export interface StaggeredChildren {
    [stagger: string]: FlipDataArray;
}
export interface FlipData {
    element: HTMLElement;
    id: string;
    stagger: string;
    springConfig: SpringConfig;
    getOnUpdateFunc: GetOnUpdateFunc;
    initializeFlip: InitializeFlip;
    onAnimationEnd: () => void;
    childIds: ChildIds;
    delayUntil?: FlipId;
    onSpringActivate?: () => void;
}
export declare type FlipDataArray = FlipData[];
export interface FlipDataDict {
    [flipId: string]: FlipData;
}
