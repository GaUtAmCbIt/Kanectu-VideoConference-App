import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import {
    Card,
    CardContent,
    Typography,
    Button,
    CardActions,
    Box,
} from '@mui/material';

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            const history = await getHistoryOfUser();
            setMeetings(history);
        };

        fetchHistory();
    }, []);

    return (
        <Box sx={{ padding: 3 }}>
            <HomeIcon
                onClick={() => routeTo('/home')}
                style={{ fontSize: '2rem', color: 'gray', marginBottom: '20px', cursor: 'pointer' }}
            />

            {meetings.length === 0 ? (
                <Typography variant="body1" color="text.secondary">
                    No meeting history available.
                </Typography>
            ) : (
                meetings.map((data, index) => (
                    <Card
                        key={index}
                        sx={{
                            marginBottom: 2,
                            backgroundColor: '#f5f5f5',
                            borderRadius: 2,
                            boxShadow: 3,
                        }}
                    >
                        <CardContent>
                            <Typography variant="h6" color="primary">
                                <h3 style={{ color: "black" }}>Code:</h3> {data.meeting_code}
                            </Typography>
                            <Typography variant="h6" color="primary">
                                <h3 style={{ color: "black" }}>Date : </h3>{new Date(data.date).toLocaleString()}
                            </Typography>
                        </CardContent>
                    </Card>
                ))
            )}
        </Box>
    );
}
