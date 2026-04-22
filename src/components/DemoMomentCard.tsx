import MomentCard from "@/components/MomentCard";
import { momentCards } from "@/data/momentCards";

const DemoMomentCard = () => {
  const moment = momentCards[0];
  return <MomentCard moment={moment} />;
};

export default DemoMomentCard;
