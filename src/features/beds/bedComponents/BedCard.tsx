import { Card, CardContent } from "../../../components/ui/Card"; // Ajustar ruta
import { Bed, User } from "lucide-react";
import type { BedData } from "../types/beds"; // Importar tipos
import { statusColors } from "../../../lib/bedsConst"; // Importar constantes



export const BedCard = ({ bed, onClick }: { bed: BedData, onClick: (bed: BedData) => void }) => (
    <Card
        className={`cursor-pointer transition-all hover:scale-105 ${statusColors[bed.status]} text-white w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center`}
        onClick={() => onClick(bed)}
    >
        <CardContent className="p-2 sm:p-3 text-center w-full">
            <Bed className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 mx-auto mb-1" />
            <div className="font-semibold text-sm sm:text-base">C{bed.id}</div>
            {bed.guest && (
                <User className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 mx-auto mt-1 opacity-80" />
            )}
        </CardContent>
    </Card>
)