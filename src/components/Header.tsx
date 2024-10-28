import React, { useState } from 'react';
import { useSession, signIn, signOut } from "next-auth/react"
import { Bitcoin } from 'lucide-react'

const Header = () => {
  const {data: session} = useSession();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = async () => {
    const result = await signIn("google");
    if (result) {
      setIsLoggedIn(true);
    }
  };

  const handleLogout = async () => {
    const result = await signOut();
    if (result) {
      setIsLoggedIn(false);
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Bitcoin className="h-8 w-8 text-orange-500 mr-2" />
          <h1 className="text-2xl font-bold text-gray-900">MeetSats</h1>
        </div>

        {session ? (
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition duration-150 ease-in-out"
          >
            Sair
          </button>
        ) : (
          <button
            onClick={handleLogin}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50"
          >
            Login
          </button>
        
        )}
      </div>
    </header>
  );
};

export default Header;
