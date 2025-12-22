import Navbar from "../components/Navbar";
import CreateAnnonce from "../components/CreateAnnonce";
// import AnnonceList from "../components/AnnonceList";

export default function Dashboard() {
  return (
    <div>
      <Navbar />
      <CreateAnnonce />
      {/* <AnnonceList /> */}
    </div>
  );
}
