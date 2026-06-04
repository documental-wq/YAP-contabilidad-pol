import React, { forwardRef } from 'react';
import logoYap from '../../assets/logo_yap.png';

export const EmpresaEmpleadosPDF = forwardRef(({ empresa, empleados }, ref) => {
    if (!empresa) return null;

    const fechaHoy = new Date().toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: '2-digit'
    }).toUpperCase();

    return (
        <div ref={ref} className="p-10 bg-white text-black font-serif text-[12px]" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto' }}>
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
                <div className="flex flex-col">
                    <img src={logoYap} alt="YAP" className="w-20 h-20 object-contain" />
                    <p className="font-bold text-lg mt-1">YAP (CRÉDITOS POR LIBRANZA)</p>
                </div>
                <div className="text-right">
                    <h1 className="font-bold text-xl uppercase">Reporte de Empleados</h1>
                    <p className="text-sm font-bold uppercase text-gray-600">{empresa.nombre}</p>
                    <p className="text-[10px] mt-2">FECHA DE GENERACIÓN: {fechaHoy}</p>
                </div>
            </div>

            {/* Content info */}
            <div className="mb-6 bg-gray-50 p-4 border border-black/10">
                <p className="font-bold uppercase mb-1">Empresa: <span className="font-normal">{empresa.nombre}</span></p>
                <p className="font-bold uppercase">Total Empleados Registrados: <span className="font-normal">{empleados?.length || 0}</span></p>
            </div>

            {/* Table */}
            <table className="w-full border-collapse border border-black">
                <thead>
                    <tr className="bg-gray-100 uppercase text-[10px]">
                        <th className="border border-black p-2 text-left">N°</th>
                        <th className="border border-black p-2 text-left">Cédula</th>
                        <th className="border border-black p-2 text-left">Nombre Completo</th>
                        <th className="border border-black p-2 text-left">Cargo</th>
                        <th className="border border-black p-2 text-left">Teléfono</th>
                    </tr>
                </thead>
                <tbody className="uppercase text-[11px]">
                    {empleados && empleados.length > 0 ? (
                        empleados.map((e, index) => (
                            <tr key={e.id}>
                                <td className="border border-black p-2 text-center">{index + 1}</td>
                                <td className="border border-black p-2 font-mono">{e.cedula}</td>
                                <td className="border border-black p-2 font-bold">{e.primer_nombre} {e.segundo_nombre || ''} {e.primer_apellido} {e.segundo_apellido || ''}</td>
                                <td className="border border-black p-2 italic">{e.cargo || '-'}</td>
                                <td className="border border-black p-2">{e.telefono || '-'}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" className="border border-black p-10 text-center font-bold text-gray-400">
                                No hay empleados registrados para esta empresa
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Footer */}
            <div className="mt-20 flex justify-between px-10">
                <div className="flex flex-col items-center">
                    <div className="w-48 border-b border-black mb-1"></div>
                    <p className="text-[10px] font-bold uppercase">Firma Autorizada YAP</p>
                </div>
                <div className="flex flex-col items-center">
                    <div className="w-48 border-b border-black mb-1"></div>
                    <p className="text-[10px] font-bold uppercase">Sello de la Empresa</p>
                </div>
            </div>

            <div className="mt-10 pt-4 border-t border-gray-200 text-center text-[9px] uppercase text-gray-400">
                Este documento es un reporte interno de vinculación para créditos por libranza.
            </div>
        </div>
    );
});
