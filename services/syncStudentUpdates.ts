import { supabase } from './supabaseClient';

/**
 * Sincroniza alterações de um aluno do banco global (students_master) 
 * para todos os projetos (project_students) que contêm esse aluno.
 */
export async function syncMasterStudentToProjects(
    studentId: string,
    updates: { name?: string; imageUrl?: string | null; year?: string; course?: string }
): Promise<number> {
    if (!supabase) return 0;

    // Monta o objeto de atualização apenas com os campos fornecidos
    const updatePayload: Record<string, any> = {};

    if (updates.name !== undefined) {
        updatePayload.name = updates.name;
    }
    if (updates.imageUrl !== undefined) {
        updatePayload.image_url = updates.imageUrl;
    }
    if (updates.year !== undefined || updates.course !== undefined) {
        // Recalcula o grade se ano ou curso mudou
        const year = updates.year ?? '';
        const course = updates.course ?? '';
        updatePayload.grade = `${year} ${course}`.trim();
        if (updates.year !== undefined) updatePayload.year = updates.year;
        if (updates.course !== undefined) updatePayload.course = updates.course;
    }

    updatePayload.updated_at = new Date().toISOString();

    if (Object.keys(updatePayload).length === 1) {
        // Apenas updated_at, nada para atualizar
        return 0;
    }

    const { data, error } = await supabase
        .from('project_students')
        .update(updatePayload)
        .eq('id', studentId)
        .select('id');

    if (error) {
        console.warn('Erro ao sincronizar aluno para projetos:', error.message);
        return 0;
    }

    return data?.length || 0;
}
