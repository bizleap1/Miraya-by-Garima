'use client';
import React from 'react';
import HeroSlider from './HeroSlider';
import ShopByCategory from './ShopByCategory';
import PremiumSlider from './PremiumSlider';
import OurStory from './OurStory';
import Collections from './Collections';
import RealBrides from './RealBrides';
import CorePillars from './CorePillars';
import Lookbook from './Lookbook';
import FinalCTA from './FinalCTA';
import { DEFAULT_SECTION_ORDER } from '../constants/defaultHomepageLayout';

// Section component registry map
const COMPONENT_REGISTRY = {
  Hero: HeroSlider,
  NewArrivals: ShopByCategory, // Keep the key as NewArrivals for DB backward compatibility, but map to new component
  ShopByCategory,
  PremiumSlider,
  OurStory,
  Collections,
  RealBrides,
  CorePillars,
  Lookbook,
  FinalCTA
};

export default function DynamicSectionRenderer({ sections = DEFAULT_SECTION_ORDER }) {
  const activeSections = (Array.isArray(sections) && sections.length > 0 ? sections : DEFAULT_SECTION_ORDER)
    .filter((sec) => sec && sec.is_active !== false);

  return (
    <>
      {activeSections.map((sec, index) => {
        const Component = COMPONENT_REGISTRY[sec.type];
        if (!Component) {
          console.warn(`[DynamicSectionRenderer] Unknown section component type: ${sec.type}`);
          return null;
        }

        const secKey = sec.id || `${sec.type}-${index}`;
        const secProps = sec.props || {};

        return (
          <div key={secKey} id={sec.id || undefined} data-section-type={sec.type} className="dynamic-section-wrapper">
            <Component {...secProps} />
          </div>
        );
      })}
    </>
  );
}
