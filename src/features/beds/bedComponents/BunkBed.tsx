import type { BedData } from "../types/beds";
import { BedCard } from "./BedCard"; 

export const BunkBed = ({ bed1, bed2, onBedClick }: { 
    bed1: BedData, 
    bed2: BedData, 
    onBedClick: (bed: BedData) => void 
}) => (
    // Cambiado de flex-col a flex-row
    <div className="flex flex-row gap-1"> 
        <BedCard bed={bed1} onClick={onBedClick} />
        <BedCard bed={bed2} onClick={onBedClick} />
    </div>
)