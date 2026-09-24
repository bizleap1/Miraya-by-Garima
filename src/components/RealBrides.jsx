'use client';
import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import './RealBrides.css';

const GoogleIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" className={className}>
    <path fill="#fff" d="M44.59 4.21a63.28 63.28 0 004.33 120.9 67.6 67.6 0 0032.36.35 57.13 57.13 0 0025.9-13.46 57.44 57.44 0 0016-26.26 74.33 74.33 0 001.61-33.58H65.27v24.69h34.47a29.72 29.72 0 01-12.66 19.52 36.16 36.16 0 01-13.93 5.5 41.29 41.29 0 01-15.1 0A37.16 37.16 0 0144 95.74a39.3 39.3 0 01-14.5-19.42 38.31 38.31 0 010-24.63 39.25 39.25 0 019.18-14.91A37.17 37.17 0 0176.13 27a34.28 34.28 0 0113.64 8q5.83-5.8 11.64-11.63c2-2.09 4.18-4.08 6.15-6.22A61.22 61.22 0 0087.2 4.59a64 64 0 00-42.61-.38z"/>
    <path fill="#e33629" d="M44.59 4.21a64 64 0 0142.61.37 61.22 61.22 0 0120.35 12.62c-2 2.14-4.11 4.14-6.15 6.22Q95.58 29.23 89.77 35a34.28 34.28 0 00-13.64-8 37.17 37.17 0 00-37.46 9.74 39.25 39.25 0 00-9.18 14.91L8.76 35.6A63.53 63.53 0 0144.59 4.21z"/>
    <path fill="#f8bd00" d="M3.26 51.5a62.93 62.93 0 015.5-15.9l20.73 16.09a38.31 38.31 0 000 24.63q-10.36 8-20.73 16.08a63.33 63.33 0 01-5.5-40.9z"/>
    <path fill="#587dbd" d="M65.27 52.15h59.52a74.33 74.33 0 01-1.61 33.58 57.44 57.44 0 01-16 26.26c-6.69-5.22-13.41-10.4-20.1-15.62a29.72 29.72 0 0012.66-19.54H65.27c-.01-8.22 0-16.45 0-24.68z"/>
    <path fill="#319f43" d="M8.75 92.4q10.37-8 20.73-16.08A39.3 39.3 0 0044 95.74a37.16 37.16 0 0014.08 6.08 41.29 41.29 0 0015.1 0 36.16 36.16 0 0013.93-5.5c6.69 5.22 13.41 10.4 20.1 15.62a57.13 57.13 0 01-25.9 13.47 67.6 67.6 0 01-32.36-.35 63 63 0 01-23-11.59A63.73 63.73 0 018.75 92.4z"/>
  </svg>
);

const reviewsData = [
  {
    id: 1,
    name: "YASH PARADKAR",
    rating: 5,
    text: "I had a wonderful experience shopping from Miraya. The quality of the fabric is excellent, the designs are elegant, and the attention to detail is impressive. The outfits are stylish, comfortable, and perfect for both casual and special occasions. The fit was exactly as expected, and the overall shopping experience was smooth. If you're looking for premium women's fashion with a modern touch, I highly recommend Miraya. Looking forward to shopping here again!"
  },
  {
    id: 2,
    name: "PADMA BIRLA",
    rating: 4,
    text: "Nice collection , fabric is also very good. Staff was very helpful nd smiling 😊 Owner ( Garima ) too greeted us and suggested us very well 👌"
  },
  {
    id: 3,
    name: "SHREYA MESHRAM",
    rating: 5,
    text: "Absolutely in love with the ethnic wear collection! The detailing on my lehenga was phenomenal and it fit perfectly. Will definitely be returning for the festive season."
  },
  {
    id: 4,
    name: "PRAVEER TARUDKAR",
    rating: 5,
    text: "Bought a beautiful co-ord set as a gift and the quality exceeded expectations. The customer service was top-notch and the delivery was right on time. Highly recommended!"
  },
  {
    id: 5,
    name: "JANVI BELWE",
    rating: 5,
    text: "Such elegant and premium designs. I wore their drape saree to a wedding and received so many compliments. Thank you Miraya by Garima for making me feel like a queen!"
  },
  {
    id: 6,
    name: "PARTH DESHMUKH",
    rating: 5,
    text: "Great place for designer suits. The material feels luxurious and the craftsmanship is brilliant. The entire shopping experience was seamless."
  }
];

const RealBrides = ({
  title = "Happy Customers",
  subtitle = "Real experiences shared by customers on Google.",
  tagline = "GOOGLE REVIEWS"
} = {}) => {
  const scrollRef = useRef(null);

  return (
    <section className="real-brides-section">
      <div className="floral-bg floral-left"></div>
      
      <div className="container">
        <div className="section-header text-center">
          <div className="style-guide-label">
            <span className="line" />
            {tagline}
            <span className="line" />
          </div>
          
          <h2 className="title">
            {title === "Happy Customers" ? (
              <>Happy <i>Customers</i></>
            ) : (
              <>{title}</>
            )}
          </h2>
          
          <p className="description">
            {subtitle}
          </p>
        </div>

        <div className="reviews-marquee-wrapper">
          <div className="reviews-marquee-track">
            {[...reviewsData, ...reviewsData].map((review, index) => (
              <div 
                key={`${review.id}-${index}`}
                className="review-card"
              >
              <div className="review-card-header">
                <div className="stars-wrapper">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={14} 
                      fill={i < review.rating ? "#FABB05" : "#e0e0e0"} 
                      color={i < review.rating ? "#FABB05" : "#e0e0e0"} 
                    />
                  ))}
                </div>
                <div className="google-badge">
                  <GoogleIcon className="google-g-small" />
                  <span>GOOGLE REVIEW</span>
                </div>
              </div>
              
              <div className="review-body">
                <p>"{review.text}"</p>
              </div>
              
              <div className="review-author">
                {review.name}
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RealBrides;
