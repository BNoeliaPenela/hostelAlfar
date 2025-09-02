import type { BedData } from "../types/beds";
import { BunkBed } from "./BunkBed";
import { HOSTEL_LAYOUT } from "../../../lib/bedsConst";
export const HostelSection = ({ section, beds, onBedClick }: {
    section: typeof HOSTEL_LAYOUT[0],
    beds: BedData[],
    onBedClick: (bed: BedData) => void
}) => {
    const sectionBeds = beds.slice(section.startBedId - 1, section.startBedId - 1 + (section.bunkBeds * 2))
    
    return (
        <div className="flex flex-col items-center space-y-2">
            <span className="text-xs text-gray-600 font-medium">Sección {section.sectionId}</span>
            {/* Ahora cada "cucheta" es una fila, y las filas se apilan verticalmente */}
            <div className="flex flex-col gap-2 sm:gap-3 md:gap-4"> {/* Cambiado a flex-col para apilar las filas de cuchetas */}
                {Array.from({ length: section.bunkBeds }, (_, i) => {
                    // bed1 y bed2 son las camas que van una al lado de la otra
                    const bed1 = sectionBeds[i * 2]
                    const bed2 = sectionBeds[i * 2 + 1]
                    return (
                        <BunkBed
                            key={`bunk-${section.sectionId}-${i}`}
                            bed1={bed1}
                            bed2={bed2}
                            onBedClick={onBedClick}
                        />
                    )
                })}
            </div>
        </div>
    )
}