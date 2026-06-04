import React from 'react';
import logoYap from '../../assets/logo_yap.png';
import { formatCOP } from '../../utils/formatCOP';
import { formatFechaCorta } from '../../utils/formatFecha';

export const ComprobantePagoPDF = ({ pago, cuota, persona, empresa }) => {
    const fechaHoy = new Date().toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).toUpperCase();

    const nroComprobante = pago.numero_comprobante || pago.id?.slice(-8).toUpperCase() || 'S/N';

    const monto = pago.monto_recibido || pago.monto_pagado || 0;

    return (
        <div className="p-12 bg-white text-black font-serif border-[1px] border-gray-200" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto' }}>
            {/* Header / Watermark style */}
            <div className="absolute top-10 right-10 opacity-10 rotate-12 pointer-events-none">
                <img src={logoYap} alt="" className="w-64 h-64 object-contain" />
            </div>

            {/* Main Header */}
            <div className="flex justify-between items-start border-b-4 border-blue-900 pb-6 mb-8 relative z-10">
                <div className="flex flex-col">
                    <img src={logoYap} alt="YAP" className="w-24 h-24 object-contain mb-2" />
                    <h2 className="font-black text-2xl text-blue-900 tracking-tighter uppercase">YAP (CRÉDITOS POR LIBRANZA)</h2>
                    <p className="text-[10px] text-gray-500 font-sans uppercase font-bold tracking-widest">Servicios Financieros Especializados</p>
                </div>
                <div className="text-right">
                    <div className="bg-blue-900 text-white px-6 py-2 rounded-bl-3xl mb-4 inline-block">
                        <h1 className="font-black text-xl uppercase tracking-widest">Recibo de Caja</h1>
                    </div>
                    <p className="text-sm font-bold text-gray-800">COMPROBANTE N°: <span className="text-red-600 font-mono text-lg">{nroComprobante}</span></p>
                    <p className="text-[10px] mt-1 text-gray-500 font-sans uppercase">Generado: {fechaHoy}</p>
                </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-2 gap-8 mb-10 relative z-10">
                {/* Client Info */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="text-[10px] font-black uppercase text-blue-900 mb-4 border-b border-blue-100 pb-1 tracking-widest">Información del Cliente</h3>
                    <div className="space-y-3">
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-bold text-gray-400">Nombre Completo:</span>
                            <span className="text-sm font-bold text-gray-900 uppercase">{persona?.primer_nombre} {persona?.segundo_nombre || ''} {persona?.primer_apellido} {persona?.segundo_apellido || ''}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-bold text-gray-400">Identificación:</span>
                            <span className="text-xs font-mono text-gray-800 font-bold">{persona?.cedula || 'N/A'}</span>
                        </div>
                        {empresa && (
                            <div className="flex flex-col">
                                <span className="text-[9px] uppercase font-bold text-gray-400">Empresa / Convenio:</span>
                                <span className="text-xs font-bold text-blue-800 uppercase">{empresa.nombre}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Detail Summary */}
                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 shadow-sm">
                    <h3 className="text-[10px] font-black uppercase text-blue-900 mb-4 border-b border-blue-100 pb-1 tracking-widest">Detalle del Pago</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-blue-100/50 pb-2">
                            <span className="text-[9px] uppercase font-bold text-gray-500">Fecha de Registro:</span>
                            <span className="text-xs font-bold text-gray-900">{formatFechaCorta(pago.fecha_pago)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-blue-100/50 pb-2">
                            <span className="text-[9px] uppercase font-bold text-gray-500">Método de Pago:</span>
                            <span className="text-xs font-bold text-blue-700 uppercase">{pago.metodo_pago}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] uppercase font-bold text-gray-500">Cuota Aplicada:</span>
                            <span className="text-xs font-bold text-gray-900">CUOTA N° {cuota?.numero_cuota}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Financial Detail Table */}
            <div className="mb-12 relative z-10">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-blue-900 text-white text-[10px] uppercase tracking-widest font-black">
                            <th className="p-4 text-left rounded-tl-xl border-r border-blue-800">Descripción del Concepto</th>
                            <th className="p-4 text-right rounded-tr-xl">Valor Recibido</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        <tr className="border-b border-gray-200">
                            <td className="p-5">
                                <p className="font-bold text-gray-900 uppercase">Abono a Préstamo #{cuota?.prestamo_id?.slice(-8).toUpperCase()}</p>
                                <p className="text-[10px] text-gray-500 mt-1 uppercase italic underline">Cancelación de cuota programada según calendario de pagos.</p>
                            </td>
                            <td className="p-5 text-right font-mono font-black text-lg text-blue-900">
                                {formatCOP(monto)}
                            </td>
                        </tr>
                        {pago.observacion && (
                            <tr className="bg-gray-50/50">
                                <td colSpan="2" className="p-4">
                                    <span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Observaciones:</span>
                                    <p className="text-[10px] text-gray-700 italic">"{pago.observacion}"</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="bg-gray-100">
                            <td className="p-5 text-right">
                                <span className="text-xs font-black uppercase text-gray-500">Total Transacción:</span>
                            </td>
                            <td className="p-5 text-right font-mono font-black text-2xl text-blue-900">
                                {formatCOP(monto)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
                <div className="mt-2 text-[10px] text-right font-bold text-blue-800 italic uppercase">
                    Valor en letras: ____________________________________________________________________________
                </div>
            </div>

            {/* Footer / Signatures */}
            <div className="mt-20 grid grid-cols-2 gap-20 px-10 relative z-10">
                <div className="flex flex-col items-center">
                    <div className="w-full border-b-2 border-black mb-2 mt-12"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-900">Recibido Conforme (Cliente)</p>
                    <p className="text-[8px] text-gray-400 font-sans">Huella Digital / Firma</p>
                </div>
                <div className="flex flex-col items-center">
                    <div className="mb-2">
                        {/* Placeholder for system stamp */}
                        <div className="w-24 h-24 border-2 border-blue-900/20 rounded-full flex flex-col items-center justify-center rotate-[-15deg]">
                            <span className="text-[8px] font-bold text-blue-900/40 uppercase">YAP CRÉDITOS</span>
                            <span className="text-[12px] font-black text-blue-900/60 uppercase">PAGADO</span>
                            <span className="text-[8px] font-bold text-blue-900/40">{formatFechaCorta(pago.fecha_pago)}</span>
                        </div>
                    </div>
                    <div className="w-full border-b-2 border-black mb-2"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-900">Cajero / Administrador</p>
                    <p className="text-[8px] text-gray-400 font-sans">CONTROL INTERNO YAP</p>
                </div>
            </div>

            {/* Bottom Disclaimer */}
            <div className="mt-24 pt-6 border-t border-gray-200 text-center relative z-10">
                <p className="text-[9px] font-bold text-blue-900 uppercase tracking-widest mb-1">¡Gracias por ser puntual en sus pagos! YAP impulsa su progreso.</p>
                <p className="text-[7px] text-gray-400 uppercase tracking-tighter">
                    Este documento es un comprobante oficial de pago electrónico generado por el sistema de gestión YAP.
                    Cualquier alteración anula su validez. Conservar para futuras reclamaciones.
                </p>
            </div>
        </div>
    );
};
