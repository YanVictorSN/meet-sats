import React from 'react';
import { Award, Clock, Users, LogIn, Wallet, Search, Send } from 'lucide-react';

const Card = ({ Icon, title, description }: { Icon: React.ElementType; title: string; description: string }) => (
  <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center text-center transition-transform transform hover:scale-105">
    <Icon className="h-12 w-12 text-orange-500 mb-4" aria-label={title} />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

export default function SatoshiRevolution() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-16 bg-gray-50">
      <section className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
          Join the Satoshi Revolution
        </h1>
        <p className="mt-4 text-lg text-gray-700">
        Be part of a transformative community where your presence and contributions are valued!
        </p>
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl font-bold text-center">How It Works:</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <Card
            Icon={LogIn}
            title="1. Login"
            description="Login with Google to get started."
          />
          <Card
            Icon={Wallet}
            title="2. Fund Your Wallet"
            description="Add funds to your wallet to start rewarding others."
          />
          <Card
            Icon={Search}
            title="3. Find a Meeting"
            description="Search for a Google Meet URL that you created."
          />
          <Card
            Icon={Send}
            title="4. Send Rewards"
            description="Reward participants via their email addresses."
          />
        </div>
      </section>

      <section className="text-center">
        <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50">
          Get Started Now
        </button>
      </section>
    </div>
  );
}
