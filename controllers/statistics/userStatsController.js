const User = require('../../models/userModel');
const catchAsync = require('../../utils/catchAsync');
const moment = require('moment');

exports.getUsersStats = catchAsync(async (req, res, next) => {
    const allUsers = await User.find();

    if (!allUsers) {
        return res.status(400).json({
            status: 'error',
            message: 'Statistiku pregleda korisnika nije moguće prikazati',
        });
    }

    let today = 0,
        dayOneFromNow = 0,
        dayTwoFromNow = 0,
        dayThreeFromNow = 0,
        dayFourFromNow = 0,
        dayFiveFromNow = 0,
        daySixFromNow = 0;

    let todayUsers = [],
        dayOneFromNowUsers = [],
        dayTwoFromNowUsers = [],
        dayThreeFromNowUsers = [],
        dayFourFromNowUsers = [],
        dayFiveFromNowUsers = [],
        daySixFromNowUsers = [];

    let under20 = 0,
        between20_30 = 0,
        between30_40 = 0,
        between40_50 = 0,
        between50_60 = 0,
        above60 = 0;

    let tmpCountryArr = [];
    for (let user of allUsers) {
        user.loginHistory.map((loginDate) => {
            const dayDiff = moment(new Date(Date.now()))
                .startOf('day')
                .diff(moment(loginDate).startOf('day'), 'days');
            switch (dayDiff) {
                case 0:
                    today++;
                    todayUsers.push(`${user.firstName} ${user.lastName}`);
                    break;
                case 1:
                    dayOneFromNow++;
                    dayOneFromNowUsers.push(
                        `${user.firstName} ${user.lastName}`
                    );
                    break;
                case 2:
                    dayTwoFromNow++;
                    dayTwoFromNowUsers.push(
                        `${user.firstName} ${user.lastName}`
                    );
                    break;
                case 3:
                    dayThreeFromNow++;
                    dayThreeFromNowUsers.push(
                        `${user.firstName} ${user.lastName}`
                    );
                    break;
                case 4:
                    dayFourFromNow++;
                    dayFourFromNowUsers.push(
                        `${user.firstName} ${user.lastName}`
                    );
                    break;
                case 5:
                    dayFiveFromNow++;
                    dayFiveFromNowUsers.push(
                        `${user.firstName} ${user.lastName}`
                    );
                    break;
                case 6:
                    daySixFromNow++;
                    daySixFromNowUsers.push(
                        `${user.firstName} ${user.lastName}`
                    );
                    break;
                default:
                    break;
            }
        });

        const yearDiff = moment(new Date(Date.now()))
            .startOf('year')
            .diff(moment(user.dob).startOf('year'), 'years');
        switch (true) {
            case yearDiff < 20:
                under20++;
                break;
            case yearDiff >= 20 && yearDiff <= 30:
                between20_30++;
                break;
            case yearDiff > 30 && yearDiff <= 40:
                between30_40++;
                break;
            case yearDiff > 40 && yearDiff <= 50:
                between40_50++;
                break;
            case yearDiff > 50 && yearDiff <= 60:
                between50_60++;
                break;
            case yearDiff > 60:
                above60++;
                break;
            default:
                break;
        }
        tmpCountryArr.push(user.country);
    }

    const countryCounts = {};

    tmpCountryArr.forEach((country) => {
        countryCounts[country] = (countryCounts[country] || 0) + 1;
    });

    const sortedCountries = Object.entries(countryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    return res.status(200).json({
        status: 'success',
        totalUsers: allUsers.length,
        todayVisit: today,
        lastDaysAppVisits: [
            daySixFromNow,
            dayFiveFromNow,
            dayFourFromNow,
            dayThreeFromNow,
            dayTwoFromNow,
            dayOneFromNow,
            today,
        ],
        lastDaysAppVisitsUsers: [
            todayUsers,
            dayOneFromNowUsers,
            dayTwoFromNowUsers,
            dayThreeFromNowUsers,
            dayFourFromNowUsers,
            dayFiveFromNowUsers,
            daySixFromNowUsers,
        ],
        usersAge: [
            under20,
            between20_30,
            between30_40,
            between40_50,
            between50_60,
            above60,
        ],
        sortedCountries,
    });
});
