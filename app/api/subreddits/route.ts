import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import yaml from 'js-yaml'

/**
 * Get list of all subreddits from YAML file
 * Reads from subreddits.yaml in project root
 */
export async function GET() {
  try {
    // Path to your YAML file in project root
    const yamlPath = join(process.cwd(), 'subreddits.yaml')

    // Read and parse YAML file
    const fileContents = readFileSync(yamlPath, 'utf8')
    const subreddits = yaml.load(fileContents) as any[]

    // Return the subreddits
    return NextResponse.json(subreddits)
  } catch (error: any) {
    console.error('Error loading subreddits:', error)

    // If file doesn't exist, return a helpful error
    if (error.code === 'ENOENT') {
      return NextResponse.json(
        {
          error: 'subreddits.yaml not found',
          message: 'Please place your subreddits.yaml file in the project root directory',
        },
        { status: 404 }
      )
    }

    // For other errors, return generic error
    return NextResponse.json(
      { error: 'Failed to load subreddits', message: error.message },
      { status: 500 }
    )
  }
}
