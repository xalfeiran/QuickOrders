<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ConfirmVerificationCodeRequest;
use App\Http\Requests\RequestVerificationCodeRequest;
use App\Services\VerificationOtpService;

class VerificationController extends Controller
{
    public function __construct(private readonly VerificationOtpService $otp) {}

    // POST /api/verify/request — send a WhatsApp code to the phone number.
    public function request(RequestVerificationCodeRequest $request)
    {
        return response()->json($this->otp->requestCode($request->validated('phone')));
    }

    // POST /api/verify/confirm — exchange a valid code for a verification grant.
    public function confirm(ConfirmVerificationCodeRequest $request)
    {
        return response()->json(
            $this->otp->confirmCode($request->validated('phone'), $request->validated('code'))
        );
    }
}
