import { Card, CardContent } from "../../../components/ui/Card"; // Ajustar ruta
import { Bed, User } from "lucide-react";
import type { BedData } from "../types/beds"; // Importar tipos
import { statusColors } from "../../../lib/bedsConst"; // Importar constantes



export const BedCard = ({ bed, onClick }: { bed: BedData, onClick: (bed: BedData) => void }) => (
    <Card
        className={`cursor-pointer transition-all hover:scale-105 ${statusColors[bed.status]} text-white sm:w-15 sm:h-15 md:w-22 md:h-22 flex items-center justify-center w-full`}
        onClick={() => onClick(bed)}
    >
        <CardContent className="p-2 sm:p-3 text-center w-full">
            <Bed className=" sm:h-7 sm:w-7 md:h-8 md:w-8 mx-auto mb-1" />
            <div className="font-semibold text-sm sm:text-base">C{bed.id}</div>
            {bed.guest && (
                <User className=" sm:h-4 sm:w-4 md:h-5 md:w-5 mx-auto mt-1 opacity-80" />
            )}
        </CardContent>
    </Card>
)