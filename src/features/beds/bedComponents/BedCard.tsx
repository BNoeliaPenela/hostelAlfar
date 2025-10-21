import { Card, CardContent } from "../../../components/ui/Card"
import { Bed, User } from "lucide-react"
import type { BedData } from "../types/beds"
import { statusColors } from "../../../lib/bedsConst"

export const BedCard = ({ bed, onClick }: { bed: BedData, onClick: (bed: BedData) => void }) => {
    const isInteractive = bed.backendId > 0
    const statusClass = isInteractive ? statusColors[bed.status] : "bg-gray-300"
    const textClass = isInteractive ? "text-white" : "text-gray-700"
    const cursorClass = isInteractive ? "cursor-pointer hover:scale-105" : "cursor-default opacity-70"

    const handleClick = () => {
        if (!isInteractive) return
        onClick(bed)
    }

    return (
        <Card
            className={`${cursorClass} transition-all ${statusClass} ${textClass} sm:w-15 sm:h-15 md:w-22 md:h-22 flex items-center justify-center w-full`}
            onClick={handleClick}
        >
            <CardContent className="p-2 sm:p-3 text-center w-full">
                <Bed className={`sm:h-7 sm:w-7 md:h-8 md:w-8 mx-auto mb-1 ${textClass}`} />
                <div className={`font-semibold text-sm sm:text-base ${textClass}`}>C{bed.id}</div>
                {bed.guest && isInteractive && (
                    <User className={`sm:h-4 sm:w-4 md:h-5 md:w-5 mx-auto mt-1 opacity-80 ${textClass}`} />
                )}
            </CardContent>
        </Card>
    )
}
