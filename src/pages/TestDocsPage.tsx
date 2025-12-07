import React from 'react'
import DocumentManager from '@/components/DocumentManager'
import { Breadcrumb } from '@/services/pdGoogleDriveApi'

const TestDocsPage = () => {
    // Mock user for DocumentManager
    const mockUser = {
        id: 'test-user',
        role: 'admin',
        name: 'Test Admin'
    }

    return (
        <div className="p-8 h-screen w-full bg-background">
            <h1 className="text-2xl font-bold mb-4">Teste de Documentos (Mocked)</h1>
            <div className="border rounded-lg p-4 bg-card shadow-sm h-[800px]">
                {/*
                  Usamos o DocumentManager com um ID fixo.
                  O hook useDriveDocuments vai bater na API mockada pelo Playwright
                  se a configuração estiver certa, OU se a gente interceptar as requests.

                  Se o modo remoto estiver habilitado via .env (VITE_DRIVE_API_URL),
                  ele vai tentar fetch('/drive/...'). O Playwright vai interceptar isso.
                */}
                <DocumentManager
                    entityId="123"
                    entityType="lead"
                    currentUser={mockUser}
                    entityName="Lead de Teste"
                />
            </div>
        </div>
    )
}

export default TestDocsPage
