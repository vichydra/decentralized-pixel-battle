import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Connect from "./pages/Connect/Connect";
import Game from "./pages/Game/Game";

const AppRoutes = () => {
   return (
       <BrowserRouter>
           <Routes>
               <Route exact path="/" element={<Connect />} />
               <Route path="/game" element={<Game />} />
           </Routes>
       </BrowserRouter>
   );
}

export default AppRoutes;
