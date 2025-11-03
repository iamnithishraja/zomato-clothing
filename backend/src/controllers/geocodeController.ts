import { Request, Response } from 'express';
import { geocodeAddress } from '../utils/locationUtils';

/**
 * Geocode an address to get coordinates
 * POST /api/v1/geocode
 * Body: { address: string }
 */
export async function geocode(req: Request, res: Response) {
  try {
    const { address } = req.body;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Address is required and must be a string'
      });
    }

    const coordinates = await geocodeAddress(address);

    if (coordinates) {
      return res.status(200).json({
        success: true,
        message: 'Address geocoded successfully',
        data: coordinates
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Could not geocode the provided address'
      });
    }
  } catch (error) {
    console.error('Error in geocode controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while geocoding address'
    });
  }
}

