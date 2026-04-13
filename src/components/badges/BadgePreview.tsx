import { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import JsBarcode from 'jsbarcode';

interface BadgePreviewProps {
  associate: {
    first_name: string;
    last_name: string;
    eid: string;
    shift?: string | null;
  };
  photoUrl?: string | null;
  badgeNumber?: string;
}

export default function BadgePreview({
  associate,
  photoUrl,
  badgeNumber,
}: BadgePreviewProps) {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current && associate.eid) {
      try {
        JsBarcode(barcodeRef.current, associate.eid, {
          format: 'CODE128',
          width: 1.5,
          height: 35,
          displayValue: false,
          margin: 0,
        });
      } catch {
        // Barcode generation may fail for certain inputs
      }
    }
  }, [associate.eid]);

  const fullName = `${associate.first_name} ${associate.last_name}`;

  return (
    <Box
      sx={{
        width: 324,
        height: 204,
        borderRadius: '12px',
        border: '2px solid #5C2D91',
        overflow: 'hidden',
        bgcolor: '#fff',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Inter", "Roboto", sans-serif',
      }}
    >
      {/* Header bar */}
      <Box
        sx={{
          bgcolor: '#5C2D91',
          px: 2,
          py: 0.75,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography
          sx={{
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.8rem',
            letterSpacing: '0.05em',
          }}
        >
          CRESCENT
        </Typography>
        {badgeNumber && (
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: '0.65rem',
              fontWeight: 500,
            }}
          >
            #{badgeNumber}
          </Typography>
        )}
      </Box>

      {/* Body */}
      <Box sx={{ display: 'flex', flex: 1, p: 1.5, gap: 1.5 }}>
        {/* Photo area */}
        <Box
          sx={{
            width: 80,
            height: 96,
            borderRadius: '6px',
            border: '1px solid #e0e0e0',
            bgcolor: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {photoUrl ? (
            <Box
              component="img"
              src={photoUrl}
              alt={fullName}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <PersonIcon sx={{ fontSize: 44, color: '#bdbdbd' }} />
          )}
        </Box>

        {/* Info area */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
            minWidth: 0,
          }}
        >
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '0.95rem',
              lineHeight: 1.2,
              color: '#212121',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {fullName}
          </Typography>
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: '#757575',
              mt: 0.5,
              fontWeight: 500,
            }}
          >
            EID: {associate.eid}
          </Typography>
          {associate.shift && (
            <Box
              sx={{
                mt: 0.75,
                display: 'inline-flex',
                alignSelf: 'flex-start',
                bgcolor: '#EDE7F6',
                color: '#5C2D91',
                px: 1,
                py: 0.25,
                borderRadius: '4px',
                fontSize: '0.65rem',
                fontWeight: 600,
              }}
            >
              {associate.shift} Shift
            </Box>
          )}
        </Box>
      </Box>

      {/* Barcode footer */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          px: 2,
          pb: 1,
        }}
      >
        <svg ref={barcodeRef} />
      </Box>
    </Box>
  );
}
