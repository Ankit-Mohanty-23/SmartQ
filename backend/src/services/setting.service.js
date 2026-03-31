import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";

const SINGLETON_ID = "singleton";

/**
 * System configs
 */

export async function getSettingValuesService(){
    return prisma.systemSettings.upsert({
        where: { id: SINGLETON_ID },
        update: {},
        create: {},
    });
}

export function updateSettingsService(data){
    return prisma.systemSettings.upsert({
        where: { id: SINGLETON_ID },
        update: data,
        create: {
            id: SINGLETON_ID,
            ...data,
        },
    });
}

function parseHolidays(settings){
    const raw = settings?.holidays;
    if(!raw) return [];

    return Array.isArray(raw) ? raw : JSON.parse(raw);
}

export async function addHolidayService(date){
    const settings = await prisma.systemSettings.findUnique({
        where: { id: SINGLETON_ID },
    });

    const current = parseHolidays(settings);

    if(current.includes(date)){
        throw new AppError("Holiday already exists", 400);
    }

    const updated = [...current, date];
    return prisma.systemSettings.upsert({
        where: { id: SINGLETON_ID },
        update: { holidays: updated },
        create: { 
            id: SINGLETON_ID,
            holidays: updated
        },
    });
}

export async function removeHolidayService(date){
    const settings = await prisma.systemSettings.findUnique({
        where: { id: SINGLETON_ID }
    });

    const current = parseHolidays(settings);

    if(!current.includes(date)){
        throw new AppError("Holiday not found", 400);
    }

    return prisma.systemSettings.update({
        where: { id: SINGLETON_ID },
        data: { holidays: current.filter((d) => d !== date) },
    });
}

export async function isPostHoliday(date){
    const d = new Date(date);
    const yesterday = new Date(
        Date.UTC(
            d.getUTCFullYear(), 
            d.getUTCMonth(),
            d.getUTCDate() - 1,
        )
    )
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const settings = await prisma.systemSettings.findUnique({
        where: { id: SINGLETON_ID }
    });

    return parseHolidays(settings).includes(yesterdayStr);
}