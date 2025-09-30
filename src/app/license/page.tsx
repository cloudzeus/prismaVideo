import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

import { getAuthSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/layout/navigation'

function formatDate(d: Date) {
	const year = d.getFullYear()
	const month = String(d.getMonth() + 1).padStart(2, '0')
	const day = String(d.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

export default async function LicensePage() {
	const session = await getAuthSession()

	if (!session?.user) {
		redirect('/login')
	}

	const user = session.user

	// Licensor details from environment variables
	const licensorName = process.env.LICENSOR_NAME || process.env.NEXT_PUBLIC_LICENSOR_NAME || 'Licensor Company'
	const licensorAddress = process.env.LICENSOR_ADDRESS || process.env.NEXT_PUBLIC_LICENSOR_ADDRESS || 'Licensor Address'

	// Default company as Licensee
	const defaultCompany = await prisma.company.findFirst({
		where: { default: true },
		select: {
			name: true,
			address: true,
			city: true,
			country: true,
			id: true,
		}
	})

	const licenseeName = defaultCompany?.name || '—'
	const licenseeAddress = [defaultCompany?.address, defaultCompany?.city, defaultCompany?.country]
		.filter(Boolean)
		.join(', ') || '—'

	// Date Issued from env (YYYY-MM-DD) or fallback to today
	const envDateIssued =
		process.env.LICENSE_DATE_ISSUED ||
		process.env.LICENSOR_DATE_ISSUED ||
		process.env.SOFTWARE_LICENSE_DATE_ISSUED ||
		process.env.NEXT_PUBLIC_LICENSE_DATE_ISSUED

	const dateIssued = envDateIssued && /^\d{4}-\d{2}-\d{2}$/.test(envDateIssued)
		? envDateIssued
		: formatDate(new Date())
	// Read serial from multiple possible keys for flexibility
	const envSerial =
		process.env.LICENSOR_SERIAL ||
		process.env.LICENSE_SERIAL ||
		process.env.LICENSE_SERIAL_COMPANY ||
		process.env.SOFTWARE_LICENSE_SERIAL ||
		process.env.SERIAL_NUMBER ||
		process.env.VIDEO_MANAGER_SERIAL ||
		process.env.NEXT_PUBLIC_LICENSE_SERIAL ||
		process.env.NEXT_PUBLIC_SERIAL_NUMBER
	const serialNumber = envSerial && envSerial.trim().length > 0
		? envSerial
		: `VIDM-${(defaultCompany?.id || 'COMP').slice(0, 6).toUpperCase()}-${dateIssued.replace(/-/g, '')}`

	return (
		<div className="min-h-screen bg-background">
			<Navigation user={user} />
			<main className="container-responsive py-6 pt-24">
				<div className="max-w-3xl mx-auto space-y-6">
					<h1 className="text-3xl font-bold tracking-tight">Software License Agreement</h1>
					<div className="bg-card rounded-lg border p-6 space-y-4 text-sm leading-6">
						<p><strong>SOFTWARE LICENSE AGREEMENT</strong></p>
						<p>This Software License Agreement ("Agreement") is made and entered into on [Date Issued]: <strong>{dateIssued}</strong> by and between:</p>
						<p>
							<strong>Licensor (Owner of Software):</strong><br />
							{licensorName}<br />
							{licensorAddress}
						</p>
						<p>
							<strong>Licensee (Purchaser of Software):</strong><br />
							{licenseeName}<br />
							{licenseeAddress}
						</p>
						<p>1. <strong>Software</strong></p>
						<p>Licensor grants to Licensee a license to use the software product known as VideoManager ("Software").</p>
						<p><strong>Serial Number:</strong> {serialNumber}</p>
						<p>2. <strong>Grant of License</strong></p>
						<p>Subject to the terms of this Agreement, Licensor grants Licensee a non-exclusive, non-transferable license to install and use the Software solely for Licensee’s internal business purposes.</p>
						<p>3. <strong>Ownership</strong></p>
						<p>The Software is licensed, not sold. Licensor retains all rights, title, and interest in and to the Software, including all intellectual property rights.</p>
						<p>4. <strong>Restrictions</strong></p>
						<ul className="list-disc list-inside space-y-1">
							<li>Copy, distribute, or sublicense the Software except as expressly permitted;</li>
							<li>Reverse engineer, decompile, or disassemble the Software;</li>
							<li>Modify or create derivative works of the Software.</li>
						</ul>
						<p>5. <strong>Term and Termination</strong></p>
						<p>This license is effective as of the Date Issued and remains in effect until terminated. Licensor may terminate this Agreement if Licensee breaches any provision. Upon termination, Licensee must stop using the Software and destroy all copies.</p>
						<p>6. <strong>Warranty Disclaimer</strong></p>
						<p>The Software is provided "as is", without warranty of any kind, express or implied, including but not limited to merchantability or fitness for a particular purpose.</p>
						<p>7. <strong>Limitation of Liability</strong></p>
						<p>Licensor shall not be liable for any indirect, incidental, or consequential damages arising from use of the Software.</p>
						<p>8. <strong>Entire Agreement</strong></p>
						<p>This Agreement constitutes the entire agreement between the parties with respect to the Software and supersedes any prior understanding.</p>
					</div>
				</div>
			</main>
		</div>
	)
}


