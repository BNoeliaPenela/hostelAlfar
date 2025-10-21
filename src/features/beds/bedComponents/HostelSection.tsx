import type { BedData } from "../types/beds"
import { BunkBed } from "./BunkBed"
import { HOSTEL_LAYOUT } from "../../../lib/bedsConst"

const createPlaceholderBed = (number: number): BedData => ({
    id: number,
    backendId: -number,
    status: "libre",
    backendStatus: "LIBRE",
})

export const HostelSection = ({ section, beds, onBedClick }: {
    section: typeof HOSTEL_LAYOUT[0],
    beds: BedData[],
    onBedClick: (bed: BedData) => void
}) => {
    const bedsByNumber = new Map<number, BedData>()
    beds.forEach((bed) => bedsByNumber.set(bed.id, bed))

    return (
        <div className="flex flex-col items-center space-y-2 w-full max-w-2xl mx-auto px-2 sm:px-4 ">
            <span className="text-xs text-gray-600 font-medium">Seccion {section.sectionId}</span>
            <div className="flex flex-col gap-2 sm:gap-3 md:gap-4">
                {Array.from({ length: section.bunkBeds }, (_, i) => {
                    const bedNumber1 = section.startBedId + (i * 2)
                    const bedNumber2 = bedNumber1 + 1
                    const bed1 = bedsByNumber.get(bedNumber1) ?? createPlaceholderBed(bedNumber1)
                    const bed2 = bedsByNumber.get(bedNumber2) ?? createPlaceholderBed(bedNumber2)

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
