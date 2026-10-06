import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import HeroSearch from "../components/HeroSearch";
import Footer from "../components/Footer";

import {
  PopularDestinations,
  FeaturedHotels,
  HotelTypes,
  FeaturedDeals,
  WhyChooseUs,
} from "../components/HomepageSections";

import { getHomepageData } from "../api/homepageApi";

function Home() {
  const [homepageData, setHomepageData] = useState({
    destinations: [],
    featuredHotels: [],
    hotelTypes: [],
    deals: [],
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHomepageData = async () => {
      try {
        setIsLoading(true);

        const response = await getHomepageData();

        if (response?.success) {
          setHomepageData({
            destinations: response.data?.destinations || [],
            featuredHotels: response.data?.featuredHotels || [],
            hotelTypes: response.data?.hotelTypes || [],
            deals: response.data?.deals || [],
          });
        }
      } catch (error) {
        console.error("Homepage API error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomepageData();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <HeroSearch />

      <PopularDestinations
        destinations={homepageData.destinations}
        isLoading={isLoading}
      />

      <FeaturedHotels
        hotels={homepageData.featuredHotels}
        isLoading={isLoading}
      />

      <HotelTypes types={homepageData.hotelTypes} isLoading={isLoading} />

      <FeaturedDeals deals={homepageData.deals} isLoading={isLoading} />

      <WhyChooseUs />

      <Footer />
    </div>
  );
}

export default Home;
